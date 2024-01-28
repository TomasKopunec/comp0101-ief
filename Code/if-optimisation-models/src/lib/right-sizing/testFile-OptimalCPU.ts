import { ModelPluginInterface } from '@grnsft/if-models/build/interfaces';
import { ModelParams } from '@grnsft/if-models/build/types/common';
import {} from './azureCPUFamily';
import {validate, atLeastOneDefined} from '../../util/validations';
import { object } from 'zod';
import {z} from 'zod';
const { loadCPUData } = require('./testAzureCPUFamily');

export class TestModel implements ModelPluginInterface {
    private cpuMetrics = ['cloud-instance-type','cloud-vendor', 'cpu-util'];
  
    // Configures the optimal CPU Plugin.

    public async configure(): Promise<ModelPluginInterface> {
      let CPUData = await loadCPUData();
      return this;
    }
  
    // Executes the calculation and output the optimal CPU

    public async execute(inputs: ModelParams[]): Promise<any[]>{
      return inputs.map(input => {
        
        input['suggested-instance-type'] = this.calculateCPUUtil(input);
        // input['suggested-cpu-util'] = this.selectHighestCPUUtil(input);
  
        return input;
      });
    }
  
    private validateSingleInput(input: ModelParams) {
      const schema = z
        .object({
          'cloud-instance-type': z.number().gte(0).min(0).optional(),
          'cloud-vendor': z.number().gte(0).min(0).optional(),
          'cpu-util': z.number().gte(0).min(0).optional(),
        })
        .refine(atLeastOneDefined, {
          message: `At least one of ${this.cpuMetrics} should present.`,
        });
  
      return validate<z.infer<typeof schema>>(schema, input);
    }
  
    // Calculate the CPU-util.

    private calculateCPUUtil(input: ModelParams) {
      const safeInput: {[key: string]: number} = this.validateSingleInput(input);
  
      return this.cpuMetrics.reduce((acc, metric) => {
        if (safeInput && safeInput[metric]) {
          acc += safeInput[metric];
        }
  
        return acc;
      }, 0);
    }

    private selectHighestCPUUtil(CPUData: any[]) {
      let highestUtil = 0;
      let bestCPU = null;
  
      // Loop through each family and then each model
      CPUData.forEach(family => {
          family.models.forEach((model: any) => {
              // Calculate or obtain cpu-util for each model
              let cpuUtil = this.calculateCPUUtil(model);
              if (cpuUtil > highestUtil) {
                  highestUtil = cpuUtil;
                  bestCPU = model;
              }
          });
      });
  
      return bestCPU;
  }

  }