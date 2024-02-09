import { z } from 'zod';

import { ModelPluginInterface } from '@grnsft/if-models/build/interfaces';
import { ModelParams } from '@grnsft/if-models/build/types/common';

import { CPUDatabase, CloudInstance } from './CPUFamily';
import { validate, atLeastOneDefined } from '../../util/validations';

export class RightSizingModel implements ModelPluginInterface {

    private database: CPUDatabase;
    private Cache: Map<string, CPUDatabase>;
    private builtinDataPath = './data';
    private cpuMetrics = ['cloud-instance-type', 'cloud-vendor', 'cpu-util'];

    constructor(database: CPUDatabase = new CPUDatabase()) {
        this.database = database;
        this.Cache = new Map<string, CPUDatabase>();
    }

    public async configure(configParams: object | undefined): Promise<ModelPluginInterface> {
        if (configParams && 'data-path' in configParams) {
            const instanceDataPath = configParams['data-path'];
            if (typeof instanceDataPath === 'string') {
                await this.database.loadModelData(instanceDataPath);
            } else {
                console.error('Error: Invalid instance data path type.');
            }
        }
        return this;
    }

    /**
     * Calculate the total emissions for a list of inputs.
     */
    public async execute(inputs: ModelParams[]): Promise<ModelParams[]> {
        let outputs: ModelParams[] = [];
        for (const input of inputs) {
            if ('cloud-vendor' in input) {
                const cloudVendor = input['cloud-vendor'];
                if (!this.Cache.has(cloudVendor)) {
                    const newDatabase = new CPUDatabase();
                    if (cloudVendor === 'aws') {
                        await newDatabase.loadModelData(this.builtinDataPath + '/aws-instances.json');
                    } else if (cloudVendor === 'azure') {
                        await newDatabase.loadModelData(this.builtinDataPath + '/azure-instances.json');
                    }
                    this.Cache.set(cloudVendor, newDatabase);
                }
                this.database = this.Cache.get(cloudVendor)!;
            }
            let processedOutputs = this.processInput(input);
            outputs.push(...processedOutputs);
        }
        return Promise.resolve(outputs);
    }

    /**
     * Validate the input parameters object, check if the necessary parameters are present.
     * 
     * @param input Input model parameters object to be validated
     * @returns True if the input is valid, false otherwise
     */
    private validateSingleInput(input: ModelParams) {
        const schema = z
            .object({
                'cloud-instance-type': z.string(),
                'cloud-vendor': z.string(),
                'cpu-util': z.number().gte(0).lte(100).or(z.string().regex(/^[0-9]+(\.[0-9]+)?$/)),
                'target-cpu-util': z.number().gte(0).lte(100).or(z.string().regex(/^[0-9]+(\.[0-9]+)?$/)).optional()
            })
            .refine(atLeastOneDefined, {
                message: `At least one of ${this.cpuMetrics} should present.`,
            });

        return validate<z.infer<typeof schema>>(schema, input);
    }

    /**
     * Process a single input instance, calculate the right-sizing and return the processed output instances.
     * 
     * @param input One single input instance (one input instance in the yaml file) to be processed
     * @returns Processed output instances (one or more) for the input instance
     */
    private processInput(input: ModelParams): ModelParams[] {
        let outputs: ModelParams[] = [];
        if (this.validateSingleInput(input)) {
            input['old-instance'] = input['cloud-instance-type'];
            input['old-cpu-util'] = input['cpu-util'];
            input['old-mem-util'] = input['mem-util'];
            let instance = this.database.getInstancesByModel(input['cloud-instance-type']);
            let util: number;
            let targetUtil: number;
            let res: [CloudInstance, number, number, number][];
            let originalMemUtil = input['mem-util'] 
            let targetRAM = (originalMemUtil / 100) * input['total-memoryGB'];

            // ensure cpu-util is a number
            if (typeof input['cpu-util'] === 'number') {
                util = input['cpu-util'] as number;
            }else if (typeof input['cpu-util'] === 'string'){
                util = parseFloat(input['cpu-util']);
            }else{
                throw new Error('cpu-util must be a number or string');
            }
            util = util / 100; // convert percentage to decimal

            // If target-cpu-util is not defined, set it to 1
            if (typeof input['target-cpu-util'] === 'undefined') {
                targetUtil = 100;
            } else {
                // Ensure that if target-cpu-util is defined, it is a number or string
                if (typeof input['target-cpu-util'] === 'number') {
                    targetUtil = input['target-cpu-util'] as number;
                } else if (typeof input['target-cpu-util'] === 'string') {
                    targetUtil = parseFloat(input['target-cpu-util']);
                } else {
                    throw new Error('target-cpu-util must be a number or string');
                }
            }
            targetUtil = targetUtil / 100; // convert percentage to decimal
            res = this.calculateRightSizing(instance, util, targetUtil, targetRAM, originalMemUtil);
            // for each instance combination, create a new output
            res.forEach(([instance, cpuUtil, memUtil, totalRAM]) => {
                let output = { ...input }; // copy input to create new output
                let processedModel = instance.model
                output['cloud-instance-type'] = processedModel;
                output['cpu-util'] = cpuUtil
                output['mem-util'] = memUtil
                output['total-memoryGB'] = totalRAM
                if (processedModel === input['old-instance']) {
                    output['recommendation'] = "Size already optimal";
                }
                outputs.push(output);
            });
        } else {
            outputs.push(input); // push input unchanged if not processing
        }
        return outputs;
    }


    private calculateRightSizing(cloudInstance: CloudInstance | null, cpuUtil: number, targetUtil: number, targetRAM: number, originalMemUtil: number): [CloudInstance, number, number, number][] {
        if (!cloudInstance) {
            throw new Error('Cloud instance not found');
        }
    
        let family = this.database.getModelFamily(cloudInstance.model);
        if (!family || family.length === 0) {
            return [[cloudInstance, cpuUtil, originalMemUtil, cloudInstance.RAM]];
        }
    
        let originalRAM = cloudInstance.RAM; // RAM of the original instance for comparison
    
        let requiredvCPUs = cpuUtil * cloudInstance.vCPUs; 
    
        let optimalCombination: [CloudInstance, number, number, number][] = [];
        let closestCPUUtilizationDiff = Number.MAX_VALUE;
        let optimalRAM = Number.MAX_VALUE;
    
        // Iterate through all possible combinations of instances
        for (let i = 0; i < (1 << family.length); i++) {
            let combination: CloudInstance[] = [];
            let totalvCPUs = 0;
            let totalRAM = 0;
    
            for (let j = 0; j < family.length; j++) {
                if (i & (1 << j)) {
                    combination.push(family[j]);
                    totalvCPUs += family[j].vCPUs;
                    totalRAM += family[j].RAM;
                }
            }
    
    
            // Skip combinations where total RAM exceeds the original instance's RAM
            if (totalRAM > originalRAM) {
                continue;
            }
    
            if (totalRAM >= targetRAM) {
                let cpuUtilizationDiff = Math.abs(requiredvCPUs - totalvCPUs);
    
                if (cpuUtilizationDiff < closestCPUUtilizationDiff || (cpuUtilizationDiff === closestCPUUtilizationDiff && totalRAM < optimalRAM)) {
                    closestCPUUtilizationDiff = cpuUtilizationDiff;
                    optimalRAM = totalRAM;
                    let totalCPUUtil = (totalvCPUs / requiredvCPUs) * 100; 
                    let totalMemUtil = (totalRAM / targetRAM) * 100; 
                    optimalCombination = combination.map(instance => [instance, totalCPUUtil, totalMemUtil, instance.RAM]);
                }
            }
        }
    
        return optimalCombination;
    }
    

}