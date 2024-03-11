import * as fs from "fs";
import { RightSizingModel } from "../../../lib/right-sizing/index.wrapper"; // This is a temp fix, will be removed once the new model is ready
import { CPUDatabase, CloudInstance } from "../../../lib/right-sizing/CPUFamily";
import { PluginParams } from "../../../types/common";
import { fixFloat } from "../../../util/util";

import scenario1 = require('./scenarios/scenario1.json');
import scenario2 = require('./scenarios/scenario2.json');
import scenario3 = require('./scenarios/scenario3.json');
import scenario4 = require('./scenarios/scenario4.json');
import scenario5 = require('./scenarios/scenario5.json');
import scenario6 = require('./scenarios/scenario6.json');

const ALG_TEST1_INPUTS = scenario1.INPUTS;
const ALG_TEST1_EXPECTED_OUTPUTS = scenario1.EXPECTED;

const ALG_TEST2_INPUTS = scenario2.INPUTS;
const ALG_TEST2_EXPECTED_OUTPUTS = scenario2.EXPECTED;

const ALG_TEST3_INPUTS = scenario3.INPUTS;
const ALG_TEST3_EXPECTED_OUTPUTS = scenario3.EXPECTED;

// Required cpu: 75% of 16 = 12
// Required memory: 50% of 64 = 32
// Fittest combination: [8, 16] + [4, 16] = 12, 32
const ALG_TEST4_INPUTS = scenario4.INPUTS;
const ALG_TEST4_EXPECTED_OUTPUTS = scenario4.EXPECTED;

// Required cpu: 75% of 16 = 12
// Required memory: 50% of 32 = 16
// Fittest combination: [8, 8] + [4, 8] = 12, 16
const ALG_TEST5_INPUTS = scenario5.INPUTS;
const ALG_TEST5_EXPECTED_OUTPUTS = scenario5.EXPECTED;

// Required cpu: 75% of 16 = 12
// Required memory: 50% of 32 = 16
// Fittest combination: [8, 8] + [4, 8] = 12, 16
const ALG_TEST6_INPUTS = scenario6.INPUTS;
const ALG_TEST6_EXPECTED_OUTPUTS = scenario6.EXPECTED;

type CombinationValues = {
    vCPUs: number;
    RAM: number;
    cost: number;
}

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
        expect(family?.[0]).toBeInstanceOf(CloudInstance);
        expect(family?.[0].model).toEqual('Test_2_8');
        expect(family?.[0].vCPUs).toEqual(2);
        expect(family?.[0].RAM).toEqual(8.0);
    });

    it("CPUDatabase.getModelFamily", () => {
        const family = db.getModelFamily('Test_4_16');
        expect(family).toBeDefined();
        expect(family?.[0].model).toEqual('Test_2_8');
    });

    it("CPUDatabase.getInstanceByModel", () => {
        const instance = db.getInstanceByModel('Test_4_16');
        expect(instance).toBeDefined();
        expect(instance).not.toBeNull();
        expect(instance?.model).toEqual('Test_4_16');
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
            "cloud-instance-type": "Standard_B16ps_v2"
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

    let model = RightSizingModel(config);
    let output : PluginParams[] = [];
    beforeAll(async () => {
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

    const compareWithExpected = (expected: PluginParams[], actual: PluginParams[]) => {

        if (expected.length !== actual.length) {
            console.error('Count of expected and actual outputs are different');
            return false;
        }

        let allMatched = true;
        for (let i = 0; i < expected.length; i++) {
            let exp = expected[i];
            let act = actual[i];
            let matched = true;
            for (let key in exp) {
                let e = exp[key];
                let a = act[key];
                if (typeof e === 'number') {
                    e = fixFloat(e);
                    a = fixFloat(a);
                }

                if (e !== a) {
                    matched = false;
                    allMatched = false;
                    break;
                }
            }
            if (!matched) {
                console.error(`Unmatched output,\n Expected: ${JSON.stringify(exp)} \n Actual: ${JSON.stringify(act)}`);
            }
        }
        return allMatched;
    };

    const getCombinedData = (outputs: PluginParams[]) => {
        let data: { [timestamp: string]: CombinationValues } = {};

        for (let i = 0; i < outputs.length; i++) {
            let out = outputs[i];
            let ins = getInstance(out['cloud-vendor'], out['cloud-instance-type']);
            if (ins) {
                let timestamp = out['timestamp'];
                if (!data[timestamp]) {
                    data[timestamp] = {
                        vCPUs: 0,
                        RAM: 0,
                        cost: 0
                    };
                }
                data[timestamp].vCPUs += ins.vCPUs;
                data[timestamp].RAM += ins.RAM;
                data[timestamp].cost += ins.getPrice(out['location']);

                data[timestamp].cost = fixFloat(data[timestamp].cost);
                data[timestamp].RAM = fixFloat(data[timestamp].RAM);
                data[timestamp].vCPUs = fixFloat(data[timestamp].vCPUs);
            }
        }
        return data;
    };

    const compareWithExpectedCombinedValues = (expected: { [timestamp: string]: CombinationValues } | PluginParams[], actual: { [timestamp: string]: CombinationValues } | PluginParams[]) => {

        if (Array.isArray(expected)) {
            expected = getCombinedData(expected);
        }

        if (Array.isArray(actual)) {
            actual = getCombinedData(actual);
        }

        let allMatched = true;
        for (let key in expected) {
            let exp = expected[key];
            let act = actual[key];
            if (exp.vCPUs !== act.vCPUs || exp.RAM !== act.RAM || exp.cost !== act.cost) {
                allMatched = false;
                console.error(`Unmatched output,\n Expected: ${JSON.stringify(exp)} \n Actual: ${JSON.stringify(act)}`);
            }
        }
        return allMatched;
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

    describe("RightSizingModel-Algorithm", () => {
        /**
         * Test if the CPU combination is correct with the default target utilisation (100%)
         * 
         * Test method:
         * For each instance from input, check if: 
         * minimum required CPUs <= Total number of CPUs of combination <= original number of CPUs
         */
        it("Is the number of total vCPUs in a valid range? (default cpu-target-util)", async () => {
            const inputs = ALG_TEST1_INPUTS;
            const outputs = await model.execute(inputs);

            const requiredCPU = inputs.map((input: PluginParams) => {
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
            for (let i = 0; i < outputs.length; i++) {
                let out = outputs[i];
                let next = outputs[i + 1];
                let ins = getInstance(out['cloud-vendor'], out['cloud-instance-type']);
                expect(ins).toBeDefined();
                expect(ins).not.toBeNull();
                combinedCPUs += (ins?.vCPUs || 0) * (out['cpu-util'] / 100);
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
        it("Is the total number of vCPUs of the combination the fittest? (default cpu-target-util)", async () => {
            const inputs = ALG_TEST1_INPUTS;
            const outputs = await model.execute(inputs);
            expect(compareWithExpectedCombinedValues(ALG_TEST1_EXPECTED_OUTPUTS, outputs)).toBeTruthy();
        });
        
        it("Is the number of total vCPUs in a valid range? (custom cpu-target-util)", async () => {
            const inputs = ALG_TEST2_INPUTS;
            const outputs = await model.execute(inputs);

            const requiredCPU = inputs.map((input: PluginParams) => {
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
            for (let i = 0; i < outputs.length; i++) {
                let out = outputs[i];
                let next = outputs[i + 1];
                let ins = getInstance(out['cloud-vendor'], out['cloud-instance-type']);
                expect(ins).toBeDefined();
                expect(ins).not.toBeNull();

                expect(out['cpu-util']).toBeLessThanOrEqual(out['target-cpu-util']);
                combinedCPUs += (ins?.vCPUs || 0) * (out['cpu-util'] / 100);
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
        it("Is the total number of vCPUs of the combination the fittest? (custom cpu-target-util)", async () => {
            const inputs = ALG_TEST2_INPUTS;
            const outputs = await model.execute(inputs);
            expect(compareWithExpectedCombinedValues(ALG_TEST2_EXPECTED_OUTPUTS, outputs)).toBeTruthy();
        });

        it("Instance combination RAM doesn't below the minimum required?", async () => {
            const inputs = ALG_TEST3_INPUTS;
            const outputs = await model.execute(inputs);

            const requiredRAM = inputs.map((input: PluginParams) => {
                let RAM = getInstance(input['cloud-vendor'], input['cloud-instance-type'])?.RAM;
                if (RAM) {
                    return input['mem-util'] / 100 * RAM;
                }else{
                    console.error('Instance not found:', input['cloud-instance-type']);
                    return 0;
                }
            });

            let j = 0;
            let combinedRAM = 0;
            for (let i = 0; i < outputs.length; i++) {
                let out = outputs[i];
                let next = outputs[i + 1];
                let ins = getInstance(out['cloud-vendor'], out['cloud-instance-type']);
                expect(ins).toBeDefined();
                expect(ins).not.toBeNull();
                combinedRAM += ins?.RAM || 0;
                if (!next || next['timestamp'] !== out['timestamp']){
                    let oldIns = getInstance(out['cloud-vendor'], out['old-instance']);
                    expect(oldIns).not.toBeNull();
                    expect(combinedRAM).toBeGreaterThanOrEqual(requiredRAM[j]);
                    j++;
                    combinedRAM = 0;
                }
            };
        });

        it("Is the total RAM of the combination the fittest?", async () => {
            const inputs = ALG_TEST4_INPUTS;
            const outputs = await model.execute(inputs);

            let timestamp = inputs[0].timestamp;

            expect(getCombinedData(outputs)[timestamp].RAM)
            .toEqual(getCombinedData(ALG_TEST4_EXPECTED_OUTPUTS)[timestamp].RAM);

            expect(getCombinedData(outputs)[timestamp].vCPUs)
            .toEqual(getCombinedData(ALG_TEST4_EXPECTED_OUTPUTS)[timestamp].vCPUs);
        });

        it ("Is the price of the combination the lowest available for this configuration?", async () => {
            const inputs = ALG_TEST5_INPUTS;
            const outputs = await model.execute(inputs);
            
            expect(compareWithExpectedCombinedValues(ALG_TEST5_EXPECTED_OUTPUTS, outputs)).toBeTruthy();
        });

        it ("Does the algorithm consider multiple same instance in a combination?", async () => {
            const inputs = ALG_TEST6_INPUTS;
            const outputs = await model.execute(inputs);
            
            expect(compareWithExpectedCombinedValues(ALG_TEST6_EXPECTED_OUTPUTS, outputs)).toBeTruthy();
        });
    });
});