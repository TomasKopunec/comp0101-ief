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
  // private allowedDateFrom: string | undefined;
  // private allowedDateTo: string | undefined;
  private allowedTimeframeRegions: string[] | undefined;

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
  
    const results: ModelParams[] = [];
    for (const timeframeRegion of this.allowedTimeframeRegions!) {
      const [fromTime, toTime] = timeframeRegion.split(' - ');
      const response = await this.getResponse(fromTime, toTime);
  
      // For each API call, enrich each input and set allowed-timeframe-regions to the current timeframeRegion only
      const enrichedInputs = inputs.map(input => ({
        ...input,
        'suggested-location': response.location,
        'suggested-timeframe': response.time,
        'suggested-score': response.rating,
        'allowed-timeframe-region': [timeframeRegion]  // Set to current timeframeRegion only
      }));
      results.push(...enrichedInputs);
    }
    return results;
  }

  private async getResponse(fromTime: string, toTime: string): Promise<ResponseData> {
    const url = this.constructUrl(fromTime, toTime);
    console.info(`Sending request to ${url}`);
    // Implement the actual API call here
    // For now, returning hardcoded values for demonstration
    return {
      location: 'London',
      time: `${fromTime}/${toTime}`,
      rating: 70
    };
  }

  private constructUrl(fromTime: string, toTime: string): string {
    const url = new URL("https://server.com" + this.ROUTE);
    const params = new URLSearchParams();
    for (const location of this.allowedLocations!) {
      params.append('locations', location);
    }
    params.append('fromTime', fromTime);
    params.append('toTime', toTime);
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

    const allowedTimeframeRegions = map.get('allowed-timeframe-regions');
  if (!Array.isArray(allowedTimeframeRegions) || allowedTimeframeRegions.length === 0) {
    this.throwError(InputValidationError, 'Required Parameter allowed-timeframe-regions is empty');
  }

  this.allowedLocations = new Set(allowedLocations);
  this.allowedTimeframeRegions = allowedTimeframeRegions;
    
    
  }

  private throwError(type: ErrorConstructor, message: string) {
    throw new type(this.errorBuilder({ message }));
  }
}