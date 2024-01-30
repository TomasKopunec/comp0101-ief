import { ModelPluginInterface } from '@grnsft/if-models/build/interfaces';
import { ModelParams } from '@grnsft/if-models/build/types/common';
import { CPUDatabase, CloudInstance } from './azureCPUFamily';

export class RightSizingModel implements ModelPluginInterface {

    private database: CPUDatabase;
    private Cache: Map<string, CPUDatabase>;

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
                            await newDatabase.loadModelData('./data/aws-instances.json');
                        } else if (cloudVendor === 'azure') {
                            await newDatabase.loadModelData('./data/azure-instances.json');
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
        
        private processInput(input: ModelParams): ModelParams[] {
            let outputs: ModelParams[] = [];
            if ('cloud-instance-type' in input && 'cpu-util' in input) {
                input['old-instance'] = input['cloud-instance-type'];
                input['old-cpu-util'] = input['cpu-util'];
        
                let instance = this.database.getInstancesByModel(input['cloud-instance-type']);
                let util = parseFloat(input['cpu-util']); // ensure cpu-util is a number
                let res = this.calculateRightSizing(instance, util);
        
                // for each instance combination, create a new output
                res.forEach(([instance, util]) => {
                    let output = { ...input }; // copy input to create new output
                    output['cloud-instance-type'] = instance.model;
                    output['cpu-util'] = util.toString(); // convert back to string if needed
                    outputs.push(output);
                });
            } else {
                outputs.push(input); // push input unchanged if not processing
            }
            return outputs;
        }

    private calculateRightSizing(cloudInstance: CloudInstance | null, cpuUtil: number): [CloudInstance, number][] {
        if (cpuUtil < 0 || cpuUtil > 1) {
            throw new Error('CPU utilization must be between 0 and 1');
        }
    
        if (!cloudInstance) {
            throw new Error('Cloud instance not found');
        }
    
        let family = this.database.getModelFamily(cloudInstance.model);
        if (!(family instanceof Array)) {
            return [[cloudInstance, cpuUtil]];
        }
    
        // calculate the required vCPUs based on the requested CPU utilization
        let requiredCPUs = Math.ceil(cloudInstance.vCPUs * cpuUtil);
        let sortedFamily = family.sort((a, b) => b.vCPUs - a.vCPUs); // Sort instances by vCPUs descending
        let optimalCombination: [CloudInstance, number][] = [];
        let remainingCPUs = requiredCPUs;
    
        // iterate over the sorted family and select instances to fulfill the required vCPUs
        for (const instance of sortedFamily) {
            while (remainingCPUs - instance.vCPUs >= 0) {
                optimalCombination.push([instance, 1]); // use full capacity of this instance
                remainingCPUs -= instance.vCPUs;
            }
            if (remainingCPUs === 0) break; // stop if we've matched the required vCPUs
        }
    
        // if there's a shortfall, use the next smallest instance to cover the remaining CPUs
        if (remainingCPUs > 0) {
            const nextSmallestInstance = sortedFamily.find(inst => inst.vCPUs >= remainingCPUs);
            if (nextSmallestInstance) {
                optimalCombination.push([nextSmallestInstance, remainingCPUs / nextSmallestInstance.vCPUs]);
            }
        }

        return optimalCombination;
    }
}