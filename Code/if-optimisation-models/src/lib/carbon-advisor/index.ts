// import axios from 'axios';

import { KeyValuePair, ModelParams } from '@grnsft/if-unofficial-models/build/types/common';
import { ModelPluginInterface } from '@grnsft/if-unofficial-models/build/interfaces';
import { buildErrorMessage } from '@grnsft/if-unofficial-models/build/util/helpers';

import { ERRORS } from '@grnsft/if-unofficial-models/build/util/errors';
const { InputValidationError } = ERRORS;


export class CarbonAdvisor implements ModelPluginInterface {
  private readonly ROUTE = "/emissions/bylocations/best";

  private readonly ALLOWED_LOCATIONS_PARAM_NAME = 'allowed-locations';
  private readonly ALLOWED_DATE_FROM_PARAM_NAME = 'allowed-date-from';
  private readonly ALLOWED_DATE_TO_PARAM_NAME = 'allowed-date-to';

  private allowedLocations: Set<string> | undefined;
  private allowedDateFrom: string | undefined;
  private allowedDateTo: string | undefined;

  errorBuilder = buildErrorMessage(CarbonAdvisor);

  // TODO: Implement authentication
  // async authenticate(authParams: object) {
  //   console.log('#authenticate()');
  //   console.log(authParams);
  //   this.authParams = authParams;
  // }

  async configure(params: object | undefined = undefined): Promise<CarbonAdvisor> {
    console.log('#configure()');
    this.validateParams(params);
    return this;
  }

  async execute(inputs: ModelParams[]): Promise<ModelParams[]> {
    console.log('#execute()');
    this.validateInputs(inputs);

    const {location, time, rating} = await this.getResponse();

    return inputs.map(input => {
      input['suggested-location'] = location;
      input['suggested-timeframe'] = time;
      input['suggested-score'] = rating;
      return input;
    });
  }

  private async getResponse(): Promise<ResponseData> {
    // TODO: Implement based on allowed-locations
    const url = this.constructUrl();
    console.info(`Sending request to ${url}`);
    return {
      location: 'London',
      time: '2020-01-01T00:00:00Z/2020-01-01T01:00:00Z',
      rating: 70
    };
  }

  private constructUrl(): string {
    const url = new URL("https://server.com" + this.ROUTE);

    // https://server.com/emissions/bylocations/best?locations=europe&locations=us&time=2023-07-06T00%3A00&toTime=2023-10-06T01%3A00

    const params = new URLSearchParams();
    for(const location of this.allowedLocations!) {
      params.append('locations', location);
    }
    params.append('time', this.allowedDateFrom!);
    params.append('toTime', this.allowedDateTo!);
    url.search = params.toString();
    return url.toString();
  }

  private validateInputs(inputs: ModelParams[]): void {
    console.log(JSON.stringify(inputs));

    // Check null
    if (inputs === undefined) {
      this.throwError(InputValidationError, 'Required Parameters not provided');
    }

    if(!Array.isArray(inputs)) {
      this.throwError(InputValidationError, 'Inputs must be an array');
    }

    // Try to parse as map
    const map = new Map(Object.entries(inputs));
  }

  private validateParams(params: object | undefined): void {
    console.info(JSON.stringify(params));

    // Check null
    if (params === undefined) {
      this.throwError(InputValidationError, 'Required Parameters not provided');
    }

    // Try to parse as map
    const map = new Map(Object.entries(params!));

    // Check if allowed-locations is provided, and non-empty
    const allowedLocations = map.get(this.ALLOWED_LOCATIONS_PARAM_NAME);
    if (allowedLocations === undefined) {
      this.throwError(InputValidationError, `Required Parameter ${this.ALLOWED_LOCATIONS_PARAM_NAME} not provided`);
    }
    if (!Array.isArray(allowedLocations) || allowedLocations.length === 0) {
      this.throwError(InputValidationError, `Required Parameter ${this.ALLOWED_LOCATIONS_PARAM_NAME} is empty`);
    }

    // Check if fromTime
    const fromTime = map.get(this.ALLOWED_DATE_FROM_PARAM_NAME);
    if (fromTime === undefined) {
      this.throwError(InputValidationError, `Required Parameter ${this.ALLOWED_DATE_FROM_PARAM_NAME} not provided`);
    }

    // Check if toTime
    const toTime = map.get(this.ALLOWED_DATE_TO_PARAM_NAME);
    if (toTime === undefined) {
      this.throwError(InputValidationError, `Required Parameter ${this.ALLOWED_DATE_TO_PARAM_NAME} not provided`);
    }
    
    // Check if toTime is after fromTime
    if (fromTime > toTime) {
      this.throwError(InputValidationError, `Required Parameter ${this.ALLOWED_DATE_TO_PARAM_NAME} is before ${this.ALLOWED_DATE_FROM_PARAM_NAME}`);
    }
    
    // Set allowed locations and timeframes
    this.allowedLocations = new Set(allowedLocations);
    this.allowedDateFrom = fromTime;
    this.allowedDateTo = toTime;
  }

  private throwError(type: ErrorConstructor, message: string) {
    throw new type(this.errorBuilder({ message }));
  }
}