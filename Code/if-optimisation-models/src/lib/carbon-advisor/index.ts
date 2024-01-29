import axios from 'axios';

import { KeyValuePair, ModelParams } from '@grnsft/if-unofficial-models/build/types/common';
import { ModelPluginInterface } from '@grnsft/if-unofficial-models/build/interfaces';
import { buildErrorMessage } from '@grnsft/if-unofficial-models/build/util/helpers';

import { ERRORS } from '@grnsft/if-unofficial-models/build/util/errors';
const { InputValidationError } = ERRORS;


export class CarbonAdvisor implements ModelPluginInterface {
  /**
   * Route to the carbon-aware-sdk API. Localhost for now.
   */
  private readonly API_URL = "http://localhost:5073";

  /**
   * Route to the carbon-aware-sdk API to get the list of supported locations.
   * {@link https://github.com/Green-Software-Foundation/carbon-aware-sdk/blob/dev/docs/carbon-aware-webapi.md#get-locations}
   */
  private readonly LOCATIONS_ROUTE = "/locations";

  /**
   * Route to the carbon-aware-sdk API to get the forecast.
   * {@link https://github.com/Green-Software-Foundation/carbon-aware-sdk/blob/dev/docs/carbon-aware-webapi.md#get-emissionsforecastscurrent}
   */
  private readonly FORECAST_ROUTE = "/emissions/forecasts/current";

  /**
   * Allowed location parameter that is passed in the config of the model.
   * The arguments are stored in a set to avoid duplicates.
   */
  private readonly ALLOWED_LOCATIONS_PARAM_NAME = 'allowed-locations';
  private readonly allowedLocations: Set<string> = new Set();

  /**
   * Allowed timeframe parameter that is passed in the config of the model.
   * The arguments are stored in a set to avoid duplicates.
   */
  private readonly ALLOWED_TIMEFRAMES_PARAM_NAME = 'allowed-timeframes';
  private readonly allowedTimeframes: Set<Timeframe> = new Set();

  /**
   * List of all locations that are supported by the carbon-aware-sdk.
   * This is used to validate the inputs provided by the user.
   * Initialized during configure() using the GET /locations API call.
   */
  private readonly supportedLocations: Set<string> = new Set();

  /**
   * Error builder function that is used to build error messages.
   */
  errorBuilder = buildErrorMessage(CarbonAdvisor);

  async configure(params: object | undefined = undefined): Promise<CarbonAdvisor> {
    console.log('#configure()');
    await this.setSupportedLocations();
    this.validateParams(params);
    return this;
  }

  async execute(inputs: ModelParams[]): Promise<ModelParams[]> {
    console.log('#execute()');
    this.validateInputs(inputs);

    const results: ModelParams[] = [];
    for (const timeframe of this.allowedTimeframes!) {
      const response = {
        location: 'London',
        time: 'suggested-time-1',
        rating: 0.5
      }  // TODO: await this.getResponse(fromTime, toTime);

      // For each API call, enrich each input and set allowed-timeframes to the current timeframeonly
      const enrichedInputs = inputs.map(input => ({
        ...input,
        'suggested-location': response.location,
        'suggested-timeframe': response.time,
        'suggested-score': response.rating,
        'allowed-timeframe': `${timeframe.from} - ${timeframe.to}`  // TODO: set to current timeframe only
      }));
      results.push(...enrichedInputs);
    }

    return results;
  }

  /**
   * Send a request to the carbon-aware-sdk API to get the list of supported locations.
   */
  private async setSupportedLocations(): Promise<void> {
    const data = await this.getResponse(this.LOCATIONS_ROUTE);
    Object.keys(data)
      .map((key: string) => data[key].name)
      .forEach((location: string) => {
        this.supportedLocations.add(location);
      });
  }

  private async getForecast(): Promise<ForecastData> {
    const params = new Map();
    for (const location of this.allowedLocations) {
      params.set('location', location);
    }
    return await this.getResponse(this.FORECAST_ROUTE, 'GET', params) as ForecastData;
  }
  /**
   * Send a request to the carbon-aware-sdk API.
   * @param route The route to send the request to.
   * @param method The HTTP method to use.
   * @param params The map of parameters to send with the request.
   * @returns The response from the API of any type.
   * @throws Error if the request fails and stops the execution of the model.
   */
  private async getResponse(route: string,
    method: string = 'GET',
    params: Map<string, string> | null = null): Promise<any> {

    const url = new URL(`${this.API_URL}${route}`);

    // Add parameters to the URL
    if (params !== null) {
      params.forEach((value, key) => {
        url.searchParams.append(key, value);
      });
    }

    // Send request
    console.log(`Sending ${method} request to ${url.toString()}`);
    return axios.request({
      url: url.toString(),
      method: method
    }).then((response) => {
      return response.data;
    }).catch((error) => {
      console.log(error);
      this.throwError(Error, error);
    });
  }

  private validateInputs(inputs: ModelParams[]): void {
    console.log(JSON.stringify(inputs));

    // Check null
    if (inputs === undefined) {
      this.throwError(InputValidationError, 'Required Parameters not provided');
    }

    if (!Array.isArray(inputs)) {
      this.throwError(InputValidationError, 'Inputs must be an array');
    }
  }

  private validateParams(params: object | undefined): void {
    console.log(JSON.stringify(params));

    // Check null
    if (params === undefined) {
      this.throwError(InputValidationError, 'Required Parameters not provided');
    }

    // Parse parameters as map
    const map = new Map(Object.entries(params!));
    this.validateLocations(map);
    this.validateTimeframes(map);
  }

  private validateLocations(map: Map<string, any>): void {
    const allowedLocations = map.get(this.ALLOWED_LOCATIONS_PARAM_NAME);
    if (allowedLocations === undefined) {
      this.throwError(InputValidationError,
        `Required Parameter ${this.ALLOWED_LOCATIONS_PARAM_NAME} not provided`);
    }
    if (!Array.isArray(allowedLocations) || allowedLocations.length === 0) {
      this.throwError(InputValidationError,
        `Required Parameter ${this.ALLOWED_LOCATIONS_PARAM_NAME} is empty`);
    }

    // For each location provided, check if it is supported (i.e. in the list of supported locations)
    allowedLocations.forEach((location: string) => {
      if (!this.supportedLocations.has(location)) {
        this.throwError(InputValidationError,
          `Location ${location} is not supported`);
      }
      this.allowedLocations.add(location);
    });
  }

  private validateTimeframes(map: Map<string, any>): void {
    const timeframes = map.get(this.ALLOWED_TIMEFRAMES_PARAM_NAME);
    if (timeframes === undefined) {
      this.throwError(InputValidationError,
        `Required Parameter ${this.ALLOWED_TIMEFRAMES_PARAM_NAME} not provided`);
    }
    if (!Array.isArray(timeframes) || timeframes.length === 0) {
      this.throwError(InputValidationError,
        `Required Parameter ${this.ALLOWED_TIMEFRAMES_PARAM_NAME} is empty`);
    }

    // For each timeframe provided, check if it is valid and add it to the set of allowed timeframes
    timeframes.forEach((timeframe: string) => {
      // For each timeframe provided, check if it is valid
      const [from, to] = timeframe.split(' - ');
      if (from === undefined || to === undefined) {
        this.throwError(InputValidationError,
          `Timeframe ${timeframe} is invalid`);
      }
      // Check if start is before end
      if (from >= to) {
        this.throwError(InputValidationError,
          `Start time ${from} must be before end time ${to}`);
      }
      this.allowedTimeframes.add({
        from: from,
        to: to
      });
    });
  }

  private throwError(type: ErrorConstructor, message: string) {
    throw new type(this.errorBuilder({ message }));
  }
}