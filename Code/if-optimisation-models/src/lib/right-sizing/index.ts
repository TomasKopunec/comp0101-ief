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
                this.Cache.set('custom', this.database);
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
            let instance = this.database.getInstanceByModel(input['cloud-instance-type']);
            let util: number;
            let targetUtil: number;
            let res: [CloudInstance, number, number, number][];
            let originalMemUtil = input['mem-util'] 
            let targetRAM = (originalMemUtil / 100) * input['total-memoryGB'];

            // ensure cpu-util is a number
            if (typeof input['cpu-util'] === 'number') {
                util = input['cpu-util'] as number;
            } else if (typeof input['cpu-util'] === 'string') {
                util = parseFloat(input['cpu-util']);
            } else {
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
                output['cpu-util'] = Math.round(cpuUtil * 1000)/10; // convert decimal to percentage
                output['mem-util'] = memUtil * 100
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

    /**
     * Calculate the optimal combination of instances to fulfill the required vCPUs, based on the CPU utilization given by the input.
     * Implemented using a knapsack-like algorithm.
     * 
     * @param cloudInstance The cloud instance object to be right-sized, the instance must be in the database
     * @param cpuUtil The percentage of CPU utilization, must be between 0 and 1
     * @returns The optimal combination of instances to fulfill the required vCPUs, returns by an array of tuples which contains the instance and the percentage of utilization
     */
    
    private calculateRightSizing(cloudInstance: CloudInstance | null, cpuUtil: number, targetUtil: number, targetRAM: number, originalMemUtil: number): [CloudInstance, number, number, number][] {
        if (!cloudInstance) {
            throw new Error('Cloud instance not found');
        }
        if (cpuUtil < 0 || cpuUtil > 1 || targetUtil < 0 || targetUtil > 1) {
            throw new Error('CPU utilization and target utilization must be between 0 and 1');
        }
    
        let family = this.database.getModelFamily(cloudInstance.model);
        if (!(family instanceof Array)) {
            // If no family data is available, return the original instance
            return [[cloudInstance, cpuUtil, originalMemUtil/100, cloudInstance.RAM]];
        }
    
        let requiredCPUs = cloudInstance.vCPUs * cpuUtil / targetUtil;
        let sortedFamily = family.sort((a, b) => b.vCPUs - a.vCPUs); // Sort instances by vCPUs descending
        let optimalCombination: [CloudInstance, number, number, number][] = [];
        let totalSelectedRAM = 0;
        let remainingCPUs = Math.ceil(requiredCPUs);
    
        for (const instance of sortedFamily) {
            let instanceCPUsFits = remainingCPUs - instance.vCPUs >= 0;
            let potentialTotalRAM = totalSelectedRAM + instance.RAM; // Updated total RAM after adding this instance
        
            if (instanceCPUsFits && potentialTotalRAM >= targetRAM) {
                let cpuUtilization = instanceCPUsFits ? targetUtil : (remainingCPUs / instance.vCPUs) * targetUtil;
                
                // Ensure totalSelectedRAM is updated before calculating newMemUtilization
                totalSelectedRAM = potentialTotalRAM; // Update totalSelectedRAM with the new potential total
                
                // Calculate memory utilization based on targetRAM divided by totalSelectedRAM, ensuring it doesn't exceed 100%
                let newMemUtilization = Math.min(targetRAM / totalSelectedRAM, 1); // Ensure it doesn't exceed 1 (100%)
                
                optimalCombination.push([instance, cpuUtilization, newMemUtilization, instance.RAM]); // Convert to percentage
                remainingCPUs -= instance.vCPUs;
            }
            if (remainingCPUs <= 0 && totalSelectedRAM >= targetRAM) {
                // Optimal combination found, break out of the loop
                break;
            }
        }
        
        
    
        // Check if we have found a valid combination or not
        if (optimalCombination.length === 0 || totalSelectedRAM < targetRAM) {
            // If no valid combination found that meets CPU and RAM requirements, return the original instance
            return [[cloudInstance, cpuUtil, originalMemUtil/100, cloudInstance.RAM]];
        }
    
        return optimalCombination;
    }

    /**
     * Get the databases of cloud instances.
     * This method is used for testing purposes.
     * 
     * @returns The databases of cloud instances
     */
    public getDatabases(): Map<string, CPUDatabase> {
        return this.Cache;
    }
}