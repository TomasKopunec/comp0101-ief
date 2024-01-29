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
            this.processInput(input);
        }
        return Promise.resolve(inputs);
    }

    private processInput(input: ModelParams): void {
        if ('cloud-instance-type' in input && 'cpu-util' in input) {
            input['old-instance'] = input['cloud-instance-type'];
            input['old-cpu-util'] = input['cpu-util'];
            let instance = this.database.getInstancesByModel(input['cloud-instance-type']);
            let util = input['cpu-util'];
            let res = this.calculateRightSizing(instance, util);
            instance = res[0];
            util = res[1];
            input['cloud-instance-type'] = instance.model;
            input['cpu-util'] = util;
        }
    }

    private calculateRightSizing(cloudInstance: CloudInstance | null, cpuUtil: number): [CloudInstance, number] {
        if (cpuUtil < 0 || cpuUtil > 1) {
            throw new Error('CPU utilization must be between 0 and 1');
        }

        if (!cloudInstance) {
            throw new Error('Cloud instance not found');
        }

        let family = this.database.getModelFamily(cloudInstance.model);
        let requireCPU = Math.ceil(cloudInstance.vCPUs * cpuUtil);
        let instance = cloudInstance;
        if (family instanceof Array) {
            family.forEach((cpu) => {
                if (cpu.vCPUs >= requireCPU) {
                    if (cpu.vCPUs < instance.vCPUs) {
                        instance = cpu;
                    }
                }
            });
        }
        return [instance, requireCPU / instance.vCPUs];
    }
}