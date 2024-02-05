import * as fs from 'fs/promises';

export class CloudInstance {
    public model: string;
    public vCPUs: number;
    public RAM: number;

    constructor(model: string, vCPUs: number, RAM: number) {
        this.model = model;
        this.vCPUs = vCPUs;
        this.RAM = RAM;
    }
}

export class CPUDatabase {
    private modelToFamily = new Map<string, string>();
    private familyToModels = new Map<string, CloudInstance[]>();
    private nameToInstance = new Map<string, CloudInstance>();

    /**
     * Get the model instance with the given name.
     * 
     * @param modelName The name of the instance model.
     * @returns The instance model object, or null if the model is not found.
     */
    public getInstancesByModel(modelName: string): CloudInstance | null {
        let normalisedModelName = modelName;
        if (!modelName.includes(".")) {
            normalisedModelName = `Standard_${modelName}`;
        }
        const model = this.nameToInstance.get(normalisedModelName);
        const modelTEST = this.nameToInstance.get("Standard_B16ps_v2");
        if (model) {
            return model;
        } else {
            return null;
        }
    }  

    /**
     * Load the instance data from a JSON file, and populate the database.
     * Note that the path is relative to the root directory of the execution path.
     * If you are running the model in "local" mode, the path is relative to the root directory of the if-optimisation-models repository.
     * If you are running the model in "docker" mode, the path is relative to the root directory of the if repository.
     * 
     * @param path The path to the JSON file containing the instances data.
     * @returns A promise that resolves when the data is loaded.
     * @throws Error if the file cannot be read.
     * 
     * @remarks This method is an async method, please use await if you want to ensure the data is loaded before continuing.
     */
    public async loadModelData(path: string) {
        try {
            const data = await fs.readFile(path, 'utf8');
            const jsonData = JSON.parse(data);
            // let jsonData = await import(path); unused
            // console.log('jsonData is:',jsonData)
            for (const familyName in jsonData) {
                const models = jsonData[familyName];

                const cpuModels = models.map((model: any) => new CloudInstance(model.model, model.vCPUs, model.RAM));
                this.familyToModels.set(familyName, cpuModels);

                await models.forEach((model: any) => {
                    this.modelToFamily.set(model.model, familyName);
                    this.nameToInstance.set(model.model, new CloudInstance(model.model, model.vCPUs, model.RAM));
                });
            }
        } catch (error) {
            console.error('Error reading file:', error);
        }
    }

    /**
     * Get all the instances of the same family as the given instance model.
     * 
     * @param modelName The name of the instance model.
     * @returns An array of the family of the instance model, or null if the model is not found.
     */
    public getModelFamily(modelName: string): { model: string, vCPUs: number, RAM: number }[] | null {
        const familyName = this.modelToFamily.get(modelName);
        if (familyName) {
            const models = this.familyToModels.get(familyName);
            if (models) {
                return models.map(cpu => ({ model: cpu.model, vCPUs: cpu.vCPUs, RAM: cpu.RAM }));
            }
        }
        return null;
    }
}

