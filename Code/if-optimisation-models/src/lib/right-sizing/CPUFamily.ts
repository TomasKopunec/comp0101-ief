import * as fs from 'fs/promises';

/**
 * Represents a cloud instance.
 */
export class CloudInstance {
    public model: string;
    public vCPUs: number;
    public RAM: number;
    public Price: { [region: string]: number };

    /**
     * Constructs a CloudInstance.
     * @param model The model of the instance.
     * @param vCPUs The number of virtual CPUs.
     * @param RAM The amount of RAM in GB.
     * @param Price The price of the instance in different regions.
     */
    constructor(model: string, vCPUs: number, RAM: number, Price: { [region: string]: number }) {
        this.model = model;
        this.vCPUs = vCPUs;
        this.RAM = RAM;
        this.Price = Price;
    }
}

/**
 * Represents a CPU database.
 */
export class CPUDatabase {
    private modelToFamily = new Map<string, string>();
    private familyToModels = new Map<string, CloudInstance[]>();
    private nameToInstance = new Map<string, CloudInstance>();

    /**
     * Retrieves an instance by model name.
     * @param modelName The model name of the instance.
     * @returns The CloudInstance corresponding to the model name, or null if not found.
     */
    public getInstanceByModel(modelName: string): CloudInstance | null {
        const model = this.nameToInstance.get(modelName);
        return model || null;
    }

    /**
     * Loads model data from the specified path.
     * @param path The path to the JSON file containing model data.
     */
    public async loadModelData(path: string) {
        try {
            const data = await fs.readFile(path, 'utf8');
            const jsonData = JSON.parse(data);
            for (const familyName in jsonData) {
                const models = jsonData[familyName];
                const cpuModels = models.map((model: any) => new CloudInstance(model.model, model.vCPUs, model.RAM, model.Price));
                this.familyToModels.set(familyName, cpuModels);
                models.forEach((model: any) => {
                    this.modelToFamily.set(model.model, familyName);
                    this.nameToInstance.set(model.model, new CloudInstance(model.model, model.vCPUs, model.RAM, model.Price));
                });
            }
        } catch (error) {
            console.error('Error reading file:', error);
        }
    }

    /**
     * Retrieves the model family based on a model name.
     * @param modelName The model name of the instance.
     * @returns The array of CloudInstance instances representing the model family, or null if not found.
     */
    public getModelFamily(modelName: string): CloudInstance[] | null {
        const familyName = this.modelToFamily.get(modelName);
        return familyName ? this.familyToModels.get(familyName) || null : null;
    }

    /**
     * Get all the instance families in the database.
     * This method is for testing purposes only.
     * 
     * @returns An array of the family names.
     */
    public getFamilies(): Map<string, CloudInstance[]> {
        return this.familyToModels;
    }
}
