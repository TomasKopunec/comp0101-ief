import { ModelPluginInterface } from '@grnsft/if-models/build/interfaces';
import { ModelParams } from '@grnsft/if-models/build/types/common';
// const { loadCPUData } = require('./testAzureCPUFamily');
import { CPUDatabase, CloudInstance } from './azureCPUFamily';

export class RightSizingModel implements ModelPluginInterface {

    private database: CPUDatabase;

    constructor(database: CPUDatabase = new CPUDatabase()){
        this.database = database;
    }

    public async configure(configParams: object | undefined): Promise<ModelPluginInterface> {
        await this.database.loadModelData('./data/azure-instances.json');
        if (configParams){
            if ('data-path' in configParams) {
                // The path to a JSON file containing the instance data is being passed in.
                const instanceDataPath = configParams['data-path'];
                if (instanceDataPath){
                    if (typeof instanceDataPath === 'string') {
                        this.database.loadModelData(instanceDataPath);
                    } else {
                        console.error('Error: Invalid instance data path type.');
                    }
                }
            }
        }
        return this;
    }

    /**
     * Calculate the total emissions for a list of inputs.
     */
    public execute(inputs: ModelParams[]): Promise<ModelParams[]>{
        return Promise.resolve(inputs.map<ModelParams>((input) => {
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
            return input;
        }));   
    }

    private calculateRightSizing(cloudInstance: CloudInstance | null, cpuUtil: number) : [CloudInstance, number]{

        if (cpuUtil < 0 || cpuUtil > 1){
            throw new Error('CPU utilization must be between 0 and 1');
        }

        if (!cloudInstance){
            throw new Error('Cloud instance not found');
        }
        
        let family = this.database.getModelFamily(cloudInstance.model);
        let requireCPU = Math.ceil(cloudInstance.vCPUs * cpuUtil);
        let instance = cloudInstance;
        if (family instanceof Array){
            family.forEach((cpu) => {
                if (cpu.vCPUs >= requireCPU){
                    if (cpu.vCPUs < instance.vCPUs) {
                        instance = cpu;
                    }
                }
            });
        }
        return [instance, instance.vCPUs / requireCPU];
    }
}