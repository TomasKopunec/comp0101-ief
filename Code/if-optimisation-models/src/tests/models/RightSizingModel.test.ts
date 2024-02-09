import * as fs from "fs";
import { RightSizingModel } from "../../lib";
import { CPUDatabase, CloudInstance } from "../../lib/right-sizing/CPUFamily";
import { ModelParams } from "@grnsft/if-models/build/types/common";

describe("CPUDatabase", () => {
    const db = new CPUDatabase();
    const path = './data/test-instances.json';
    beforeAll(async () => await db.loadModelData(path));

    it("CPUDatabase.loadModelData", () => {
        expect(db.getFamilies()).toBeDefined();
        const families = db.getFamilies();
        expect(families.size).toBeGreaterThan(0);
        expect(families.get('TestFamily')).toBeDefined();
        const family = families.get('TestFamily');
        expect(family).toBeDefined();
        expect(family?.length).toEqual(3);
        expect(family?.[0]).toBeInstanceOf(CloudInstance);
        expect(family?.[0].model).toEqual('Standard_test1_2_8');
        expect(family?.[0].vCPUs).toEqual(2);
        expect(family?.[0].RAM).toEqual(8.0);
    });

    it("CPUDatabase.getModelFamily", () => {
        const family = db.getModelFamily('Standard_test2_4_16');
        expect(family).toBeDefined();
        expect(family?.length).toEqual(3);
        expect(family?.[0].model).toEqual('Standard_test1_2_8');
    });

    it("CPUDatabase.getInstanceByModel", () => {
        const instance = db.getInstanceByModel('test2_4_16');
        expect(instance).toBeDefined();
        expect(instance).not.toBeNull();
        expect(instance?.model).toEqual('Standard_test2_4_16');
        expect(instance?.vCPUs).toEqual(4);
        expect(instance?.RAM).toEqual(16.0);
    });
});

describe("RightSizingModel", () => {
    const config = {
        "data-path": "./data/test-instances.json"
    };
    const inputs = [
        {
            "timestamp": "2023-11-02T10:35:00.000Z",
            "duration": 300,
            "cloud-vendor": "azure",
            "cpu-util": 50,
            "mem-availableGB": 0.488636416,
            "mem-usedGB": 0.5113635839999999,
            "total-memoryGB": 1,
            "mem-util": 51.13635839999999,
            "location": "uksouth",
            "cloud-instance-type": "B16ps_v2"
        },
        {
            "timestamp": "2023-11-02T10:40:00.000Z",
            "duration": 300,
            "cloud-vendor": "aws",
            "cpu-util": 75,
            "mem-availableGB": 0.48978984960000005,
            "mem-usedGB": 0.5102101504,
            "total-memoryGB": 30,
            "mem-util": 51.021015039999995,
            "location": "uksouth",
            "cloud-instance-type": "a1.4xlarge"
        }
    ];

    let model = new RightSizingModel();
    let output : ModelParams[] = [];
    beforeAll(async () => {
        model = await model.configure(config) as RightSizingModel;
        output = await model.execute(inputs);
    });

    let databases = model.getDatabases();

    const getInstance = (vendor: string, model: string) => {
        const db = databases.get(vendor);
        if (db) {
            return db.getInstanceByModel(model);
        }
        return null;
    };

    it("Is Defined?", () => {
        expect(RightSizingModel).toBeDefined();
    });

    it("Can Load Builtin Data?", () => {
        const data = model.getDatabases();
        expect(data).toBeDefined();
        expect(data.has('aws')).toBeTruthy();
        expect(data.has('azure')).toBeTruthy();
        expect(data.get('aws')?.getFamilies().size).toBeGreaterThan(0);
        expect(data.get('azure')?.getFamilies().size).toBeGreaterThan(0);
    });

    it("Can Load Custom Data?", () => {
        const data = model.getDatabases();
        expect(data).toBeDefined();
        expect(data.has('custom')).toBeTruthy();
        expect(data.get('custom')?.getFamilies().size).toBeGreaterThan(0);
        expect(data.get('custom')?.getFamilies().get('TestFamily')).toBeDefined();
    });

    it("Correctly Executed?", () => {
        expect(output).toBeDefined();
        expect(output.length).toBeGreaterThanOrEqual(inputs.length);
        expect(output[0]).toHaveProperty('old-instance');
        expect(output[0]).toHaveProperty('old-cpu-util');
    });

    describe("RightSizingModel-Algorithms", () => {
        it("Correct CPU combination with default target utilisation?", () => {
            const requiredCPU = inputs.map((input: ModelParams) => {
                let vCPUs = getInstance(input['cloud-vendor'], input['cloud-instance-type'])?.vCPUs;
                if (vCPUs) {
                    return input['cpu-util'] / 100 * vCPUs;
                }else{
                    console.error('Instance not found:', input['cloud-instance-type']);
                    return 0;
                }
            });
            
            let j = 0;
            let combinedCPUs = 0;
            for (let i = 0; i < output.length; i++) {
                let out = output[i];
                let next = output[i + 1];
                let ins = getInstance(out['cloud-vendor'], out['cloud-instance-type']);
                expect(ins).toBeDefined();
                expect(ins).not.toBeNull();
                combinedCPUs += ins?.vCPUs || 0;
                if (!next || next['timestamp'] !== out['timestamp']){
                    let oldIns = getInstance(out['cloud-vendor'], out['old-instance']);
                    expect(oldIns).not.toBeNull();
                    expect(combinedCPUs).toBeGreaterThanOrEqual(requiredCPU[j]);
                    expect(combinedCPUs).toBeLessThanOrEqual(oldIns!.vCPUs);
                    j++;
                    combinedCPUs = 0;
                }
            };
        });
    });
});