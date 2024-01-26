import { ModelPluginInterface } from '@grnsft/if-models/build/interfaces';
import { ModelParams } from '@grnsft/if-models/build/types/common';

import { CPUDatabase, CPUFamily, CPU } from './azureCPUFamily';

export class RightSizingModel implements ModelPluginInterface {

    private cpuDatabase: CPUDatabase;
    private targetUtilization: number = 1.0;

    constructor(params: ModelParams) {
        this.cpuDatabase = new CPUDatabase();
        if (params.hasOwnProperty('cpuData')) {
            this.cpuDatabase.loadDatabase(params['cpuData']);
        }
    }
    
    configure(params: object | undefined): Promise<ModelPluginInterface> {
        let cpuDataPath: Array<string> = [];
        if (params) {
            if ('cpuData' in params) {
                if (params['cpuData'] instanceof Array && typeof params['cpuData'][0] === 'string') {
                    cpuDataPath = params['cpuData'] as Array<string>;
                }
            }
            if ('targetUtilization' in params) {
                if (typeof params['targetUtilization'] === 'number' && params['targetUtilization'] > 0 && params['targetUtilization'] <= 1){
                    this.targetUtilization = params['targetUtilization'] as number;
                }else{
                    console.log('targetUtilization must be a number between 0 and 1');
                }
            }
        }

        if (cpuDataPath.length > 0) {
            for (let path of cpuDataPath) {
                this.cpuDatabase.loadDatabase(path);
            }
        }
        return Promise.resolve(this);
    }

    execute(inputs: ModelParams[]): Promise<ModelParams[]> {
        
        return Promise.resolve(inputs.map<ModelParams>((input) => {
            let cpuUtil: number = input['cpuUtilization'];
            let cpuFamilyName: string = input['cpuFamily'];
            let cpuFamily: CPUFamily | null = this.cpuDatabase.getFamily(cpuFamilyName);
            if (cpuFamily){
                let cpuModelName: string = input['cpuModel'];
                let cpuModel: CPU | null = cpuFamily.getModel(cpuModelName);
                // let cpuThreads: number = input['cpuThreads'];
                // let cpuClock: number = input['cpuClock'];
                // let cpuTurbo: number = input['cpuTurbo'];
                if (cpuModel) {
                    let rightSizingModel = cpuFamily.getRightSizingModel(cpuModel, cpuUtil);
                    if (rightSizingModel != null && rightSizingModel != cpuModel) {
                        input['rightSizingModel'] = rightSizingModel.model;
                    }
                }
            }
            return input;
        }));
    }

    private parseCPUModel(cpuModel: CPU|string): CPU | null {
        if (typeof cpuModel === 'string') {
            let cpuFamilyName: string = cpuModel.split('-')[0];
            let cpuModelName: string = cpuModel.split('-')[1];
            let cpuFamily: CPUFamily | null = this.cpuDatabase.getFamily(cpuFamilyName);
            if (cpuFamily) {
                return cpuFamily.getModel(cpuModelName);
            } else {
                return null;
            }
        } else {
            return cpuModel;
        }
    }
}

  