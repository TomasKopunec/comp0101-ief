import { ModelPluginInterface } from '@grnsft/if-models/build/interfaces';
import { ModelParams } from '@grnsft/if-models/build/types/common';
import { config } from 'dotenv';
import { object } from 'zod';

export class CloudInstance {
    public name: string;
    public vCPU: number;
    public family: InstanceFamily;

    constructor(name: string, vCPU: number, family: InstanceFamily) {
        this.name = name;
        this.vCPU = vCPU;
        this.family = family;
    }
}

export class InstanceFamily {
    public name: string;
    public instances: Map<string, CloudInstance>;

    constructor(name: string, instances: Map<string, CloudInstance> = new Map<string, CloudInstance>()) {
        this.name = name;
        this.instances = instances;
    }
}

export class RightSizingModel implements ModelPluginInterface {

    private instanceFamilies : Map<string, InstanceFamily>;
    private instances : Map<string, CloudInstance>;

    constructor(instanceData: Map<string, InstanceFamily>|null = null){
        if (instanceData){
            this.instanceFamilies = instanceData;
        }else{
            this.instanceFamilies = new Map<string, InstanceFamily>();
        }

        this.instances = new Map<string, CloudInstance>();
        if (this.instanceFamilies && this.instanceFamilies.size > 0){
            this.instanceFamilies.forEach((family: InstanceFamily) => {
                family.instances.forEach((instance: CloudInstance) => {
                    this.instances.set(instance.name, instance);
                });
            });
        }
    }

    public async configure(configParams: object | undefined): Promise<ModelPluginInterface> {
        if (configParams){
            if ('instances' in configParams){
                // The whole instance data is being passed in.
                const instanceConfig = configParams['instances'];
                if (instanceConfig){
                    if (instanceConfig instanceof Map){
                        this.importData(instanceConfig);
                    }else{
                        console.error('Error: Invalid instance data type.');
                    }
                }

            if ('additionalDataPath' in configParams){
                // The path to a JSON file containing the instance data is being passed in.
                const instanceDataPath = configParams['additionalDataPath'];
                if (instanceDataPath){
                        if (typeof instanceDataPath === 'string'){
                            this.importFromJSON(instanceDataPath);
                        }else{
                            console.error('Error: Invalid instance data path type.');
                        }
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
            if ('instance' in input && 'cpuUtil' in input){
                input.oldInstance = input.instance;
                input.instance = this.calculateRightSizing(input.instance, input.cpuUtil);
            }
            return input;
        }));   
    }

    private addInstance(instance: CloudInstance){
        this.instances.set(instance.name, instance);
    }

    private importData(instanceData: Map<string, InstanceFamily>){
        for (let [familyName, family] of instanceData.entries()){
            if (this.instanceFamilies.has(familyName)){
                let existingFamily = this.instanceFamilies.get(familyName);
                let newFamily = new InstanceFamily(family.name, new Map<string, CloudInstance>([...existingFamily!.instances, ...family.instances]));
                this.instanceFamilies.set(family.name, newFamily);

                newFamily.instances.forEach((instance: CloudInstance) => {
                    this.instances.set(instance.name, instance);
                });
            }else{
                this.instanceFamilies.set(family.name, family);
                family.instances.forEach((instance: CloudInstance) => {
                    this.instances.set(instance.name, instance);
                });
            }
        }
    }

    private importFromJSON(instanceDataPath: string){
        let instanceData: Map<string, InstanceFamily> | null = null;
        if (instanceDataPath){
            try{
                instanceData = require(instanceDataPath);
                let instanceDataMap = new Map<string, InstanceFamily>(instanceData?.entries());
                this.importData(instanceDataMap);
            }catch(err){
                if (err instanceof Error){
                    if (err.name === 'MODULE_NOT_FOUND'){
                        console.error('Error importing instance data from: ' + instanceDataPath);
                        console.log('Error: File not found.');
                        return;
                    }else{
                        console.error('Error importing instance data from: ' + instanceDataPath);
                        console.log(err);
                        return;
                    }
                }
            }
        } 
    }

    private calculateRightSizing(cloudInstance: CloudInstance, cpuUtil: number) : CloudInstance{

        if (cpuUtil < 0 || cpuUtil > 1){
            throw new Error('CPU utilization must be between 0 and 1');
        }

        let family = cloudInstance.family;
        let instances = family.instances;

        let instance = cloudInstance;
        if (cpuUtil !== 1 && family.instances.size > 1){
            let requiredCPU = Math.ceil(instance.vCPU * cpuUtil);
            for (const [_, ins] of instances.entries()){
                if (ins.vCPU >= requiredCPU){
                    if (ins.vCPU < instance.vCPU){
                        instance = ins;
                    }
                }
            }
        }
        return instance;
    }
}
