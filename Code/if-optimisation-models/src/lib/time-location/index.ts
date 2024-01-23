
import { ModelPluginInterface } from '@grnsft/if-models/build/interfaces';
import { ModelParams } from '@grnsft/if-models/build/types/common';

import * as dayjs from 'dayjs';
/*fake*/
export class TimeLocation implements ModelPluginInterface {

    private testVal1: number = 0;
    private testVal2: string = '';
    private testVal3: boolean = false;
    private testVal4: number[] = [];

    constructor(){
        
    }

    public async configure(configParams: object | undefined): Promise<ModelPluginInterface> {
        if (configParams){
            if ('val1' in configParams){
                this.testVal1 = configParams['val1'] as number;
            }
            if ('val2' in configParams){
                this.testVal2 = configParams['val2'] as string;
            }
            if ('val3' in configParams){
                this.testVal3 = configParams['val3'] as boolean;
            }
            if ('val4' in configParams){
                this.testVal4 = configParams['val4'] as number[];
            }
        }
        return this;
    }
    /**
     * Calculate the total emissions for a list of inputs.
     */
    public execute(inputs: ModelParams[]): Promise<ModelParams[]>{
        return Promise.resolve(inputs.map<ModelParams>((input) => {
            let dt = dayjs(input.datetime);
            dt.add(this.testVal1, 'hour');
            input.newDatetime = dt.toISOString();

            let i = 1;
            if (input.num){
                i = input.num;
            }
            input.newNum = this.testVal1 * i;
            input.newStr = this.testVal2 + ' ' + String(i);
            input.newBool = this.testVal3 || (i % 2 == 0);
            input.newArr = this.testVal4.map((val) => val * i);
            return input;
        }));
    }

}
