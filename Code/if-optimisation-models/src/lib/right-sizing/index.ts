import { z } from 'zod';

import { PluginInterface } from '../../types/plugin-interface';
import { ConfigParams, PluginParams } from '../../types/common';
import { InstanceData, CombinationData, CurrentData, OriginalData } from '../../types/right-sizing';

import { CPUDatabase, CloudInstance } from './CPUFamily';
import { validate, atLeastOneDefined } from '../../util/validations';
import { fixFloat } from '../../util/util';

import * as crypto from 'crypto';

export const RightSizingModel = (params: ConfigParams): PluginInterface => {

    const metadata = {
        kind: 'execute'
    };

    let database: CPUDatabase = new CPUDatabase();
    const Cache: Map<string, CPUDatabase> = new Map();
    const builtinDataPath = './data';
    const cpuMetrics = ['cpu-util', 'cloud-vendor', 'cloud-instance-type'];

    const configure = (configParams: ConfigParams) => {
        // Load model data if 'data-path' is provided in configParams
        if (configParams && 'data-path' in configParams) {
            const instanceDataPath = configParams['data-path'];
            if (typeof instanceDataPath === 'string') {
                database.loadModelData_sync(instanceDataPath);
                Cache.set('custom', database); // Cache the loaded database
            } else {
                console.error('Error: Invalid instance data path type.');
            }
        }
    }
    
    
    configure(params);

    const execute = async (inputs: PluginParams[]) => {
        let outputs: PluginParams[] = [];

        // Process each input
        for (const input of inputs) {
            // Check if 'cloud-vendor' key exists in input
            if ('cloud-vendor' in input) {
                const cloudVendor = input['cloud-vendor'];
                // Check if database for the cloud vendor is cached
                if (!Cache.has(cloudVendor)) {
                    // If not cached, create a new database instance and load model data for the specific cloud vendor
                    const newDatabase = new CPUDatabase();
                    if (cloudVendor === 'aws') {
                        await newDatabase.loadModelData(builtinDataPath + '/aws-instances.json');
                    } else if (cloudVendor === 'azure') {
                        await newDatabase.loadModelData(builtinDataPath + '/azure-instances.json');
                    }
                    Cache.set(cloudVendor, newDatabase); // Cache the loaded database
                }
                database = Cache.get(cloudVendor)!; // Set database to the cached one
            }

            // Process input and collect processed outputs
            let processedOutputs = processInput(input);
            outputs.push(...processedOutputs); // Append processed outputs to the outputs array
        }

        return Promise.resolve(outputs); // Resolve the promise with the outputs array
    }

    const processInput = (input: PluginParams): PluginParams[] => {
        let outputs: PluginParams[] = [];

        // Validate input and proceed if valid
        if (validateSingleInput(input)) {
            // Store original instance details
            input['old-instance'] = input['cloud-instance-type'];
            input['old-cpu-util'] = input['cpu-util'];
            input['old-mem-util'] = input['mem-util'];

            // Retrieve instance details from database
            let instance = database.getInstanceByModel(input['cloud-instance-type']);
            if (!instance) {
                throw new Error(`Invalid cloud instance: ${input['cloud-instance-type']}, not found in cloud vendor database: ${input['cloud-vendor']}`);
            }
            let util: number;
            let targetUtil: number;
            let res: InstanceData[];
            let originalMemUtil = input['mem-util'];
            let targetRAM = (originalMemUtil / 100) * instance.RAM;
            let region = input['location'];

            // Ensure cpu-util is a number
            if (typeof input['cpu-util'] === 'number') {
                util = input['cpu-util'] as number;
            } else if (typeof input['cpu-util'] === 'string') {
                util = parseFloat(input['cpu-util']);
            } else {
                throw new Error('cpu-util must be a number or string');
            }
            util = util / 100; // Convert percentage to decimal

            // Set target CPU utilization to 100 if not defined
            if (typeof input['target-cpu-util'] === 'undefined') {
                targetUtil = 100;
            } else {
                // Ensure target-cpu-util is a number or string
                if (typeof input['target-cpu-util'] === 'number') {
                    targetUtil = input['target-cpu-util'] as number;
                } else if (typeof input['target-cpu-util'] === 'string') {
                    targetUtil = parseFloat(input['target-cpu-util']);
                } else {
                    throw new Error('target-cpu-util must be a number or string');
                }
            }
            targetUtil = targetUtil / 100; // Convert percentage to decimal

            // Calculate right sizing for the instance
            res = calculateRightSizing(instance, util, targetUtil, targetRAM, originalMemUtil, region);

            // generate unique id to use for cases where many instances replace one
            let output_id = crypto.randomUUID();

            // Create a new output for each instance combination
            res.forEach((combination) => {
                let output = { ...input }; // Copy input to create new output
                let processedModel = combination.instance.model;

                // Update output parameters
                output['cloud-instance-type'] = processedModel;
                output['cpu-util'] = fixFloat(combination.cpuUtil * 100, 2);
                output['mem-util'] = fixFloat(combination.memUtil * 100, 2);
                output['total-memoryGB'] = combination.instance.RAM;
                if (res.length > 1) {
                    output['output-id'] = output_id
                }

                // Determine price change
                if (combination.priceDifference > 0) {
                    output['price-change'] = `Price decreased by ${Math.ceil(combination.priceDifference)}%`;
                } else {
                    output['price-change'] = `Price has increased by ${Math.ceil(Math.abs(combination.priceDifference))}%`;
                }

                // Set recommendation based on processed model
                if (processedModel === input['old-instance']) {
                    output['Recommendation'] = "Size already optimal";
                }

                outputs.push(output); // Add output to outputs array
            });
        } else {
            outputs.push(input); // Push input unchanged if not processing
        }

        return outputs;
    }

    const validateSingleInput = (input: PluginParams) => {
        const schema = z
        .object({
            'cloud-instance-type': z.string(),
            'cloud-vendor': z.string(),
            'cpu-util': z.number().gte(0).lte(100).or(z.string().regex(/^[0-9]+(\.[0-9]+)?$/)),
            'target-cpu-util': z.number().gte(0).lte(100).or(z.string().regex(/^[0-9]+(\.[0-9]+)?$/)).optional()
        })
        .refine(atLeastOneDefined, {
            message: `At least one of ${cpuMetrics} should present.`,
        });

        return validate<z.infer<typeof schema>>(schema, input);
    }

    const findOptimalCombination = (index: number, family: CloudInstance[], 
        originalData: OriginalData, optimalData: CombinationData, currentData: CurrentData): CombinationData => {
            try {
                // if index exceeds the length of the family array, return the current optimal data
                if (index >= family.length) return { ...optimalData }
                const instance = family[index];
    
                // Check if adding the current instance would exceed the RAM of original instance
                // If it exceeds, try the next one (family has been sorted in descending order).
                if (currentData.currentRAM + instance.RAM > originalData.originalRAM) {
                    return findOptimalCombination(index + 1, family, originalData, optimalData, currentData);
                }
    
                currentData.currentCPUs += instance.vCPUs;
                currentData.currentRAM += instance.RAM;
                currentData.currentCost += instance.getPrice(originalData.region);
                currentData.combination.push(instance);
    
                // Check if the current combination meets the target requirements
                if (currentData.currentRAM >= originalData.targetRAM && currentData.currentCPUs >= originalData.requiredvCPUs) {
                    const currentExceededCPUs = fixFloat(currentData.currentCPUs - originalData.requiredvCPUs, 5)
                    const currentRAM = fixFloat(currentData.currentRAM, 5);
                    const currentCost = fixFloat(currentData.currentCost, 5);
                    const currentLength = currentData.combination.length;
    
                    const optimalExceedCPU = fixFloat(optimalData.exceedCPUs, 5);
                    const optimalRAM = fixFloat(optimalData.optimalRAM, 5);
                    const lowestCost = fixFloat(optimalData.lowestCost, 5);
                    const optimalLength = optimalData.optimalCombination.length;
    
                    // Update optimal combination if the current combination is better
                    if (currentExceededCPUs < optimalExceedCPU ||
                        (currentExceededCPUs === optimalExceedCPU && currentRAM < optimalRAM) ||
                        (currentExceededCPUs === optimalExceedCPU && currentRAM === optimalRAM && currentData.currentCost < lowestCost) ||
                        (currentExceededCPUs === optimalExceedCPU && currentRAM === optimalRAM && currentCost === lowestCost && currentLength < optimalLength)) {
                        optimalData.exceedCPUs = currentExceededCPUs;
                        optimalData.optimalRAM = currentRAM;
                        optimalData.lowestCost = currentCost;
                        let totalCPUUtil = (originalData.requiredvCPUs / currentData.currentCPUs);
                        let totalMemUtil = (originalData.targetRAM / currentData.currentRAM);
                        // Update optimal combination array
                        optimalData.optimalCombination = currentData.combination.map((instance: CloudInstance) => {
                            return {
                                instance: instance,
                                cpuUtil: totalCPUUtil,
                                memUtil: totalMemUtil,
                                price: instance.getPrice(originalData.region),
                                priceDifference: 0
                            }
                        });
                    }
                }
    
                // Include the instance and recurse
                optimalData = findOptimalCombination(index, family, originalData, optimalData, currentData);
    
                // Backtrack: Exclude the current instance and recurse
                currentData.currentCPUs -= instance.vCPUs;
                currentData.currentRAM -= instance.RAM;
                currentData.currentCost -= instance.getPrice(originalData.region);
                currentData.combination.pop();
    
                // Exclude the instance and recurse
                optimalData = findOptimalCombination(index + 1, family, originalData, optimalData, currentData);
            } catch (err) {
                throw (err)
            }
            // Return the final optimal combination details
            return { ...optimalData };
        }

    const calculateRightSizing = (cloudInstance: CloudInstance, cpuUtil: number, targetUtil: number, 
        targetRAM: number, originalMemUtil: number, region: string): InstanceData[] => {
        // Check if the cloud instance is valid
        if (!cloudInstance) {
            throw new Error(`Invalid cloud instance: ${cloudInstance}`);
        }

        // Retrieve the model family of the cloud instance
        let family = database.getModelFamily(cloudInstance.model);
        // If no model family is found, return the original instance
        if (!family || family.length === 0) {
            return [{
                instance: cloudInstance,
                cpuUtil: cpuUtil,
                memUtil: originalMemUtil,
                price: cloudInstance.getPrice(region),
                priceDifference: 0
            }];
        }

        // Sort family in descending order based on RAM size
        family.sort((a, b) => b.RAM - a.RAM);

        // Prepare parameters for recursive findOptimalCombination.
        // original cost, RAM size, required vCPUs, target cpu util, target RAM, region of the instance
        let originalData: OriginalData = {
            originalCost: cloudInstance.getPrice(region),
            originalRAM: cloudInstance.RAM,
            requiredvCPUs: cpuUtil * cloudInstance.vCPUs / targetUtil,
            targetUtil: targetUtil,
            targetRAM: targetRAM,
            region: region
        }
        // Initialize an object to store the optimal data with default values
        let optimalCombination: InstanceData[] = [];
        let optimalData: CombinationData = {
            optimalCombination: optimalCombination,
            exceedCPUs: Number.MAX_VALUE,
            optimalRAM: Number.MAX_VALUE,
            lowestCost: Number.MAX_VALUE
        }
        // Initialize variables for the current state of the combination being evaluated
        let currentData: CurrentData = {
            combination: [],
            currentCPUs: 0,
            currentRAM: 0,
            currentCost: 0
        }
        // Start the recursive search for the optimal combination
        let index = 0;
        optimalData = findOptimalCombination(index, family, originalData, optimalData, currentData);

        // If an optimal combination is found
        optimalCombination = optimalData.optimalCombination;
        if (optimalCombination.length > 0) {
            // Calculate final total cost and price difference
            let finalTotalCost = optimalCombination.reduce((sum, insData) => sum + insData.instance.getPrice(region), 0);
            let priceDifference = originalData.originalCost - finalTotalCost; // This will be positive, indicating savings
            let priceDifferencePercentage = (priceDifference / originalData.originalCost) * 100;
            console.log(`Final total cost: ${finalTotalCost}, Price difference: ${priceDifference}, Price difference percentage: ${priceDifferencePercentage}`);
            // Update the optimalCombination to include the price difference percentage
            optimalCombination.forEach((insData) => {
                insData.cpuUtil = insData.cpuUtil * targetUtil;
                insData.priceDifference = priceDifferencePercentage;
            });
        } else {
            // If no better combination found, use the original instance
            //optimalCombination = [[cloudInstance, cpuUtil, originalMemUtil, cloudInstance.RAM, cloudInstance.getPrice(region), 0]];
            optimalCombination = [{
                instance: cloudInstance,
                cpuUtil: cpuUtil,
                memUtil: originalMemUtil,
                price: cloudInstance.getPrice(region),
                priceDifference: 0
            }];
        }

        return optimalCombination;
    }
    
    const getDatabases = (): Map<string, CPUDatabase> => {
        return Cache;
    }

    return {
        metadata,
        execute
    };
}