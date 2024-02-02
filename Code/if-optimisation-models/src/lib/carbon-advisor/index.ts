import axios from 'axios';
import { KeyValuePair, ModelParams } from '@grnsft/if-unofficial-models/build/types/common';
import { ModelPluginInterface } from '@grnsft/if-unofficial-models/build/interfaces';
import { buildErrorMessage } from '@grnsft/if-unofficial-models/build/util/helpers';

import { ERRORS } from '@grnsft/if-unofficial-models/build/util/errors';
const { InputValidationError } = ERRORS;

 // Make sure you have the 'qs' library installed


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
  private hasSampling: boolean = false;
  private sampling: number = 0;
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

  // async execute(inputs: ModelParams[]): Promise<ModelParams[]> {
  //   console.log('#execute()');
  //   this.validateInputs(inputs);

  //   const results: ModelParams[] = [];
  //   for (const timeframe of this.allowedTimeframes!) {
  //     const response = {
  //       location: 'westus',
  //       time: '2022-08-01T19:00:00Z',
  //       rating: 0.5
  //     }  // TODO: await this.getResponse(fromTime, toTime);

  //     // For each API call, enrich each input and set allowed-timeframes to the current timeframeonly
  //     const enrichedInputs = inputs.map(input => ({
  //       ...input,
  //       'suggested-location': response.location,
  //       'suggested-timeframe': response.time,
  //       'suggested-score': response.rating//,
  //       // 'allowed-timeframe': `${timeframe.from} - ${timeframe.to}`  // TODO: set to current timeframe only
  //     }));
  //     results.push(...enrichedInputs);
  //   }

  //   return results;
  // }

  async execute(inputs: ModelParams[]): Promise<ModelParams[]> {
    console.log('#execute()');
    this.validateInputs(inputs);
  
    let results: ModelParams[] = inputs.map(input => ({
      ...input,
      suggestions: [],
      plotted_points: [] // Initialize an empty array to hold all suggestions
    }));
    
  
  
    const locationsArray = Array.from(this.allowedLocations);
    let allResponses: any[] = []; // Array to store all response items
    let allResponses1: any[] = []; // Array to store all response items
    let best_responses: any[] = []; // Store selected best responses from the first API call
    let best_responses2: any[] = []; // Store selected best responses from the second API call
    
    for (const [index, timeframe] of Array.from(this.allowedTimeframes).entries()) {
      // Your loop logic using 'index'...
      const startTime = timeframe.from;
      const endTime = timeframe.to;
  
      const route = "/emissions/bylocations/best";
      const route1 = "/emissions/bylocations";
      const params = {
        location: locationsArray,
        time: startTime,
        toTime: endTime
      };
      let allocations: any[] = [];
      if (this.hasSampling) {
        allocations = this.calculateSubrangeAllocation(this.sampling);
        // Store or use the 'allocations' list as needed
        console.log('Allocations:', allocations);
      }
      interface ApiResponse {
        location: string;
        time: string;
        rating: number;
        duration: string;
      }
    
      try {
        const response = await this.getResponse(route, 'GET', params);
        if (response.length === 0) {
          console.log(`No data returned for timeframe starting at ${timeframe.from}`);
        } else {
          
         
        console.log('API call succeeded for timeframe', timeframe, 'with response:', response);

        allResponses = allResponses.concat(response); // Store all response items

        
        const randomIndex = Math.floor(Math.random() * response.length);
        best_responses.push(response[randomIndex]); 
        }

      } catch (error) {
        console.error('API call failed for timeframe', timeframe, 'with error:', error);
      }

      if (this.hasSampling) {
        console.log('Using sampling parameter in execution logic.');
        
        try {
          let response1 = await this.getResponse(route1, 'GET', params);
          if (response1.length === 0) {
            console.log(`No data returned for timeframe starting at ${timeframe.from}`);
          } else {
           
          response1 = response1.filter((r1: ApiResponse) => !allResponses.some(r => r.location === r1.location && r.time === r1.time));
          // Use the current index's allocation to add responses to best_responses2
          const currentAllocation = allocations[index]-1;
          for (let i = 0; i < currentAllocation && response1.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * response1.length);
            best_responses2.push(response1.splice(randomIndex, 1)[0]);
          }
          console.log('API call succeeded for timeframe', timeframe, 'with response:', response1);
          allResponses1 = allResponses1.concat(response1); // Store all response items
        }
        } catch (error) {
          console.error('API call failed for timeframe', timeframe, 'with error:', error);
        }

      }

    }
    console.log('best response:', best_responses);
    console.log('best response2:', best_responses2);
    // Determine the lowest rating among all responses
    const lowestRating = Math.min(...allResponses.map(item => item.rating));
  
    // Filter all responses to get items with the lowest rating
    const lowestRatingItems = allResponses.filter(item => item.rating === lowestRating);
    const all_best = [...best_responses, ...best_responses2];
    // Include all items with the lowest rating in the suggestions
    if (this.hasSampling) {
    all_best.forEach(item => {
      results[0].plotted_points.push({
        'location': item.location,
        'time': item.time,
        'score': item.rating
      });
    });
  }
    lowestRatingItems.forEach(item => {
      results[0].suggestions.push({
        'suggested-location': item.location,
        'suggested-timeframe': item.time,
        'suggested-score': item.rating
      });
    });
  
    console.log('Results:', results);
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
  private async getResponse(route: string, method: string = 'GET', params: any = null): Promise<any> {
    const url = new URL(`${this.API_URL}${route}`);

    // Manually serialize params to match the required format: 'location=eastus&location=westus&...'
    let queryString = '';
    if (params) {
        queryString = Object.entries(params).map(([key, value]) => {
            if (Array.isArray(value)) {
                // Convert each value to a string before encoding and repeat the key for each value in the array
                return value.map(v => `${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`).join('&');
            } else {
                // Convert value to a string before encoding and directly append to query string
                return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
            }
        }).join('&');
    }

    const finalUrl = `${url}${queryString ? '?' + queryString : ''}`;

    //console.log(`Sending ${method} request to ${finalUrl}`);

    return axios({
        url: finalUrl,
        method: method,
    }).then((response) => {
        return response.data;
    }).catch((error) => {
        console.error(error);
        this.throwError(Error, error.message);
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
    this.validateSampling(map); 

    
  }
  private validateSampling(map: Map<string, any>): void {
    this.sampling = map.get('sampling');
    this.hasSampling = this.sampling >0; // Set the global flag based on the presence of 'sampling'
  
    if (this.hasSampling && (typeof this.sampling !== 'number' || this.sampling <= 0)) {
      console.warn('`sampling` provided but not a positive number. Ignoring `sampling`.');
    }
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

  private calculateSubrangeAllocation(sampling:number) {
    const durations = Array.from(this.allowedTimeframes).map(timeframe => {
      const start = new Date(timeframe.from).getTime();
      const end = new Date(timeframe.to).getTime();
      return (end - start) / 1000; // Duration in seconds

      return (end - start) / 1000; // Duration in seconds
    });
  
    const totalDuration = durations.reduce((a, b) => a + b, 0);
    let allocations = durations.map(duration =>
      Math.round(sampling * (duration / totalDuration))
    );
  
    // Adjust allocations to ensure the sum equals sampling
    while (allocations.reduce((a, b) => a + b, 0) > sampling) {
      const maxIndex = allocations.indexOf(Math.max(...allocations));
      allocations[maxIndex] -= 1;
    }
    while (allocations.reduce((a, b) => a + b, 0) < sampling) {
      const minIndex = allocations.indexOf(Math.min(...allocations));
      allocations[minIndex] += 1;
    }
  
    return allocations;
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