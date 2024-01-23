// import axios from 'axios';

import { KeyValuePair, ModelParams } from '@grnsft/if-unofficial-models/build/types/common';
import { ModelPluginInterface } from '@grnsft/if-unofficial-models/build/interfaces';
import { buildErrorMessage } from '@grnsft/if-unofficial-models/build/util/helpers';

export class CarbonAwareModel implements ModelPluginInterface {
  name: string | undefined;
  staticParams: object | undefined = undefined;
  protected authParams: object | undefined;
  errorBuilder = buildErrorMessage(CarbonAwareModel);

  async authenticate(authParams: object) {
    console.log('#authenticate()');
    console.log(authParams);
    this.authParams = authParams;
  }

  async configure(staticParams: object): Promise<ModelPluginInterface> {
    // Pring staticParams to console
    console.log('#configure()');
    console.log(staticParams);

    this.staticParams = staticParams;

    if (staticParams === undefined) {
      throw new Error('Required Parameters not provided');
    }
    return this;
  }

  async execute(inputs: ModelParams[]): Promise<any[]> {
    console.log('#execute()');
    console.log(inputs);

    // basic validation
    if (inputs === undefined) {
      throw new Error('Required Parameters not provided');
    } else if (!Array.isArray(inputs)) {
      throw new Error('inputs must be an array');
    }

    return inputs.map((input: KeyValuePair) => input);
  }
}