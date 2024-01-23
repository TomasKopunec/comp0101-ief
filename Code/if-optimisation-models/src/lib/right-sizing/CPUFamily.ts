export class CPUDatabase {
    private families = new Map<string, CPUFamily>();

    public addFamily(family: CPUFamily) {
        this.families.set(family.name, family);
    }

    public getFamily(familyName: string): CPUFamily | null {
        if (this.families.has(familyName)) {
            let res = this.families.get(familyName);
            if (res !== undefined) {
                return res;
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    public hasFamily(familyName: string): boolean {
        return this.families.has(familyName);
    }

    // load CPU data from json file
    public loadDatabase(path: string) {
        let CPUData : any = import(path);
        this.families.clear();
        this.families = new Map<string, CPUFamily>(CPUData.Families.map((family: CPUFamily) => {
            let cpuFamily = new CPUFamily(family.name, family.generation);
            family.models.forEach((model: any) => {
                cpuFamily.addModel(new CPU(model.model, cpuFamily, model.cores, model.threads, model.clock, model.turbo));
            });
            return [cpuFamily.name, cpuFamily];
        }));
    }
}

export class CPUFamily {
    public name: string;
    public generation: number;

    public models = new Map<string, CPU>();

    constructor(name: string, generation: number, models: Map<string, CPU> = new Map<string, CPU>()) {
        this.name = name;
        this.generation = generation;
        this.models = models;
    }

    public addModel(cpu: CPU) {
        cpu.family = this;
        this.models.set(cpu.model, cpu);
    }

    public getModel(modelName: string): CPU | null {
        if (this.models.has(modelName)) {
            let res = this.models.get(modelName);
            if (res !== undefined) {
                return res;
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    public hasModel(modelName: string): boolean {
        return this.models.has(modelName);
    }

    public getModelNames(): string[] {
        return Array.from(this.models.keys());
    }

    public getRightSizingModel(currentModel: CPU|string, cpuUtil: number): CPU | null {
        if (cpuUtil > 1){
            throw new Error('CPU utilization must be between 0 and 1');
        }
        let currentCPU: CPU | undefined | null = null;
        if (typeof currentModel === 'string') {
            if (this.models.has(currentModel)){
                if (this.models.get(currentModel) !== undefined) {
                    currentCPU = this.models.get(currentModel)!;
                }
            } 
        }else{
            currentCPU = currentModel;
        }

        if (!currentCPU) {
            throw new Error('Current CPU model not found');
        }

        let rightSizingModel: CPU | null = null;
        let utiledCores = Math.ceil(currentCPU.cores * cpuUtil);
        let currentCores = currentCPU.cores;

        if (utiledCores < currentCores) {

            Array.from(this.models.values()).forEach((model) => {
                if (model.cores >= utiledCores && model.cores < currentCores) {
                    currentCores = model.cores;
                    rightSizingModel = model;
                }
            });
            return rightSizingModel;
        }else{
            return currentCPU;
        }
    }
}

export class CPU {
    public model: string;
    public family: CPUFamily;
    public cores: number;
    public threads: number;
    public clockSpeed: number;
    public turboSpeed: number;

    constructor(model: string, family: CPUFamily, cores: number, threads: number, clockSpeed: number, turboSpeed: number) {
        this.model = model;
        this.family = family;
        this.cores = cores;
        this.threads = threads;
        this.clockSpeed = clockSpeed;
        this.turboSpeed = turboSpeed;
    }
}