import * as fs from 'fs/promises';

export class CloudInstance {
    public model: string;
    public vCPUs: number;

    constructor(model: string, vCPUs: number) {
        this.model = model;
        this.vCPUs = vCPUs;
    }
}

export class CPUDatabase {
    private modelToFamily = new Map<string, string>();
    private familyToModels = new Map<string, CloudInstance[]>();
    private nameToInstance = new Map<string, CloudInstance>();

    public getInstancesByModel(modelName: string): CloudInstance | null {
        const underscoreIndex = modelName.indexOf('_');
        if (underscoreIndex !== -1 && underscoreIndex < modelName.length - 1) {
            modelName = modelName.substring(underscoreIndex + 1);
        }

        const model = this.nameToInstance.get(modelName);
        if (model) {
            return model;
        } else {
            return null;
        }
    }  

    public async loadModelData(path: string) {
        try {
            const data = await fs.readFile(path, 'utf8');
            const jsonData = JSON.parse(data);
            // let jsonData = await import(path);

            for (const familyName in jsonData) {
                const models = jsonData[familyName];
                const cpuModels = models.map((model: any) => new CloudInstance(model.model, model.vCPUs));
                this.familyToModels.set(familyName, cpuModels);

                models.forEach((model: any) => {
                    this.modelToFamily.set(model.model, familyName);
                    this.nameToInstance.set(model.model, new CloudInstance(model.model, model.vCPUs));
                });
            }
        } catch (error) {
            console.error('Error reading file:', error);
        }
    }

    public getModelFamily(modelName: string): { model: string, vCPUs: number }[] | null {
        const underscoreIndex = modelName.indexOf('_');
        if (underscoreIndex !== -1 && underscoreIndex < modelName.length - 1) {
            modelName = modelName.substring(underscoreIndex + 1);
        }

        const familyName = this.modelToFamily.get(modelName);
        if (familyName) {
            const models = this.familyToModels.get(familyName);
            if (models) {
                return models.map(cpu => ({ model: cpu.model, vCPUs: cpu.vCPUs }));
            }
        }
        return null;
    }
}

    

