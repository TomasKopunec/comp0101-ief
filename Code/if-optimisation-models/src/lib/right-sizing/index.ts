import { z } from 'zod';

import { ModelPluginInterface } from '@grnsft/if-models/build/interfaces';
import { ModelParams } from '@grnsft/if-models/build/types/common';

import { CPUDatabase, CloudInstance } from './CPUFamily';
import { validate, atLeastOneDefined } from '../../util/validations';

import * as crypto from 'crypto';

/**
 * Implementation of the ModelPluginInterface for the Right Sizing model.
 */
export class RightSizingModel implements ModelPluginInterface {
    private database: CPUDatabase;
    private Cache: Map<string, CPUDatabase>;
    private builtinDataPath = './data';
    private cpuMetrics = ['cloud-instance-type', 'cloud-vendor', 'cpu-util'];

    /**
     * Constructs a RightSizingModel instance.
     * @param database The CPU database to be used. Defaults to a new CPUDatabase instance if not provided.
     */
    constructor(database: CPUDatabase = new CPUDatabase()) {
        this.database = database;
        this.Cache = new Map<string, CPUDatabase>();
    }

    /**
     * Configures the model with the provided parameters.
     * @param configParams Configuration parameters for the model.
     * @returns A Promise resolving to the configured RightSizingModel instance.
     */
    public async configure(configParams: object | undefined): Promise<ModelPluginInterface> {
        // Load model data if 'data-path' is provided in configParams
        if (configParams && 'data-path' in configParams) {
            const instanceDataPath = configParams['data-path'];
            if (typeof instanceDataPath === 'string') {
                await this.database.loadModelData(instanceDataPath);
                this.Cache.set('custom', this.database); // Cache the loaded database
            } else {
                console.error('Error: Invalid instance data path type.');
            }
        }
        return this; // Return the configured instance
    }

/**
 * Executes the model with the given inputs and returns the corresponding outputs.
 * @param inputs The list of input parameters for the models.
 * @returns A Promise resolving to an array of model parameters representing the outputs.
 */
public async execute(inputs: ModelParams[]): Promise<ModelParams[]> {
    let outputs: ModelParams[] = [];

    // Process each input
    for (const input of inputs) {
        // Check if 'cloud-vendor' key exists in input
        if ('cloud-vendor' in input) {
            const cloudVendor = input['cloud-vendor'];
            // Check if database for the cloud vendor is cached
            if (!this.Cache.has(cloudVendor)) {
                // If not cached, create a new database instance and load model data for the specific cloud vendor
                const newDatabase = new CPUDatabase();
                if (cloudVendor === 'aws') {
                    await newDatabase.loadModelData(this.builtinDataPath + '/aws-instances.json');
                } else if (cloudVendor === 'azure') {
                    await newDatabase.loadModelData(this.builtinDataPath + '/azure-instances.json');
                }
                this.Cache.set(cloudVendor, newDatabase); // Cache the loaded database
            }
            this.database = this.Cache.get(cloudVendor)!; // Set database to the cached one
        }

        // Process input and collect processed outputs
        let processedOutputs = this.processInput(input);
        outputs.push(...processedOutputs); // Append processed outputs to the outputs array
    }
    
    return Promise.resolve(outputs); // Resolve the promise with the outputs array
}


    /**
     * Validate the input parameters object, check if the necessary parameters are present.
     * 
     * @param input Input model parameters object to be validated
     * @returns True if the input is valid, false otherwise
     */
    private validateSingleInput(input: ModelParams) {
        const schema = z
            .object({
                'cloud-instance-type': z.string(),
                'cloud-vendor': z.string(),
                'cpu-util': z.number().gte(0).lte(100).or(z.string().regex(/^[0-9]+(\.[0-9]+)?$/)),
                'target-cpu-util': z.number().gte(0).lte(100).or(z.string().regex(/^[0-9]+(\.[0-9]+)?$/)).optional()
            })
            .refine(atLeastOneDefined, {
                message: `At least one of ${this.cpuMetrics} should present.`,
            });

        return validate<z.infer<typeof schema>>(schema, input);
    }

/**
 * Processes a single input to generate multiple outputs, each representing a different instance combination.
 * @param input The input parameters for the model.
 * @returns An array of model parameters representing different instance combinations.
 */
private processInput(input: ModelParams): ModelParams[] {
    let outputs: ModelParams[] = [];

    // Validate input and proceed if valid
    if (this.validateSingleInput(input)) {
        // Store original instance details
        input['old-instance'] = input['cloud-instance-type'];
        input['old-cpu-util'] = input['cpu-util'];
        input['old-mem-util'] = input['mem-util'];

        // Retrieve instance details from database
        let instance = this.database.getInstanceByModel(input['cloud-instance-type']);
        let util: number;
        let targetUtil: number;
        let res: [CloudInstance, number, number, number, number, number][];
        let originalMemUtil = input['mem-util'];
        let targetRAM = (originalMemUtil / 100) * input['total-memoryGB'];
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
        res = this.calculateRightSizing(instance, util, targetUtil, targetRAM, originalMemUtil, region);

        // generate unique id to use for cases where many instances replace one
        let output_id = crypto.randomUUID();

        // Create a new output for each instance combination
        res.forEach(([instance, cpuUtil, memUtil, totalRAM, price, priceDifference]) => {
            let output = { ...input }; // Copy input to create new output
            let processedModel = instance.model;

            // Update output parameters
            output['cloud-instance-type'] = processedModel;
            output['cpu-util'] = cpuUtil;
            output['mem-util'] = memUtil;
            output['total-memoryGB'] = totalRAM;
            if (res.length > 1) {
                output['output-id'] = output_id
            }

            // Determine price change
            if (priceDifference > 0) {
                output['price-change'] = `Price decreased by ${Math.ceil(priceDifference)}%`;
            } else {
                output['price-change'] = `Price has increased by ${Math.ceil(Math.abs(priceDifference))}%`;
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



/**
 * @param cloudInstance The original cloud instance to be analyzed.
 * @param cpuUtil The current CPU utilization percentage.
 * @param targetUtil The target CPU utilization percentage.
 * @param targetRAM The target RAM size in GB.
 * @param originalMemUtil The original memory utilization percentage.
 * @param region The region where the cloud instance resides.
 * @returns An array containing the optimal combination of cloud instances along with
 *          their CPU utilization, memory utilization, RAM size, price, and price difference percentage.
 */
private calculateRightSizing(
    cloudInstance: CloudInstance | null, cpuUtil: number, targetUtil: number, targetRAM: number, originalMemUtil: number, region: string
): [CloudInstance, number, number, number, number, number][] {
    // Check if the cloud instance is valid
    if (!cloudInstance) {
        throw new Error('Cloud instance not found');
    }
    
    // Retrieve the model family of the cloud instance
    let family = this.database.getModelFamily(cloudInstance.model);
    // If no model family is found, return the original instance
    if (!family || family.length === 0) {
        return [[cloudInstance, cpuUtil, originalMemUtil, cloudInstance.RAM, cloudInstance.Price[region], 0]];
    }
    
    // Store original cost, RAM size, and calculate required vCPUs
    let originalCost = cloudInstance.Price[region];
    let originalRAM = cloudInstance.RAM;
    let requiredvCPUs = cpuUtil * cloudInstance.vCPUs; 

    // Initialize variables for optimal combination
    let optimalCombination: [CloudInstance, number, number, number, number, number][] = [];
    let closestCPUUtilizationDiff = Number.MAX_VALUE;
    let optimalRAM = Number.MAX_VALUE;
    let lowestCost = Number.MAX_VALUE;

    // Iterate through all possible combinations of instances
    for (let i = 0; i < (1 << family.length); i++) {
        let combination: CloudInstance[] = [];
        let totalvCPUs = 0;
        let totalRAM = 0;
        let totalCost = 0;

        // Generate each combination
        for (let j = 0; j < family.length; j++) {
            if (i & (1 << j)) {
                combination.push(family[j]);
                totalvCPUs += family[j].vCPUs;
                totalRAM += family[j].RAM;
                totalCost += family[j].Price[region] || 0;
            }
        }

        // Skip combinations where total RAM exceeds the original instance's RAM
        if (totalRAM > originalRAM) {
            continue;
        }

        // Check if the combination meets RAM requirements
        if (totalRAM >= targetRAM) {
            let cpuUtilizationDiff = Math.abs(requiredvCPUs - totalvCPUs);

            // Update optimal combination if a better one is found
            if (cpuUtilizationDiff < closestCPUUtilizationDiff || (cpuUtilizationDiff === closestCPUUtilizationDiff && (totalRAM < optimalRAM || (totalRAM === optimalRAM && totalCost < lowestCost)))) {
                closestCPUUtilizationDiff = cpuUtilizationDiff;
                optimalRAM = totalRAM;
                lowestCost = totalCost;
                let totalCPUUtil = (totalvCPUs / requiredvCPUs) * 100; 
                let totalMemUtil = (totalRAM / targetRAM) * 100; 
                optimalCombination = combination.map(instance => [instance, totalCPUUtil, totalMemUtil, instance.RAM, instance.Price[region], 0]);
            }
        }
    }

    // If an optimal combination is found
    if (optimalCombination.length > 0) {
        // Calculate final total cost and price difference
        let finalTotalCost = optimalCombination.reduce((sum, [instance]) => sum + instance.Price[region], 0);
        let priceDifference = originalCost - finalTotalCost; // This will be positive, indicating savings
        let priceDifferencePercentage = (priceDifference / originalCost) * 100;
        console.log(`Final total cost: ${finalTotalCost}, Price difference: ${priceDifference}, Price difference percentage: ${priceDifferencePercentage}`);
        // Update the optimalCombination to include the price difference percentage
        optimalCombination = optimalCombination.map(([instance, cpuUtil, memUtil, ram, price]): [CloudInstance, number, number, number, number, number] => [instance, cpuUtil, memUtil, ram, price, priceDifferencePercentage]);
    } else {
        // If no better combination found, use the original instance
        optimalCombination = [[cloudInstance, cpuUtil, originalMemUtil, cloudInstance.RAM, cloudInstance.Price[region], 0]];
    }

    return optimalCombination;
}

    /**
     * Get the databases of cloud instances.
     * This method is used for testing purposes.
     * 
     * @returns The databases of cloud instances
     */
    public getDatabases(): Map<string, CPUDatabase> {
        return this.Cache;
    }
}