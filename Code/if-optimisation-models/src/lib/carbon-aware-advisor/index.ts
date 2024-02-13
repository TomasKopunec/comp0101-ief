import axios from 'axios';
import { ModelParams } from '@grnsft/if-unofficial-models/build/types/common';
import { ModelPluginInterface } from '@grnsft/if-unofficial-models/build/interfaces';
import { buildErrorMessage } from '@grnsft/if-unofficial-models/build/util/helpers';

import { ERRORS } from '@grnsft/if-unofficial-models/build/util/errors';

import { promises as fsPromises } from 'fs';
import * as path from 'path';

const { InputValidationError } = ERRORS;
interface EmissionsData {
  location: string;
  time: string;
  rating: number;
  duration: string;
}
// Make sure you have the 'qs' library installed
export class CarbonAwareAdvisor implements ModelPluginInterface {
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
  private ALLOWED_LOCATIONS_PARAM_NAME = 'allowed-locations';
  private allowedLocations: Set<string> = new Set();

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
  //number of last days to get average score
  private lastDaysNumber: number = 500;
  private sampling: number = 0;
  // Use for read from locations.json
  private locationsFilePath = path.join(__dirname, '../../../../../..','src', 'lib', 'carbon-aware-advisor', 'locations.json');

  /**
   * Error builder function that is used to build error messages.
   */
  errorBuilder = buildErrorMessage(CarbonAwareAdvisor);
  
  
  // Use for read from locations.json
  async loadLocations() {
    try {
      const data = await fsPromises.readFile(this.locationsFilePath, 'utf-8');
      const locationsObject = JSON.parse(data);
    return locationsObject;
    } catch (error) {
      console.error('Error reading from locations.json:', error);
      // Return an empty set in case of error
      return new Set(); 
    }
  }
  
  async configure(params: object | undefined = undefined): Promise<CarbonAwareAdvisor> {
    console.log('#configure()');
    await this.setSupportedLocations();
    this.validateParams(params);
    return this;
  }

  async execute(inputs: ModelParams[]): Promise<ModelParams[]> {
    this.validateInputs(inputs);
    // Use aggregatedMatchingValues to store all matching values from localData
    let aggregatedMatchingValues: Set<string> = new Set();

    // For each input, get the allowed locations and check if they are in the list of supported locations
    for (const input of inputs) {
      const allowedLocations = input['allowed-locations'];
      const localData = await this.loadLocations(); 
      let matchingValues: any[] = [];
      
      // For each key in localData, check if it is in the list of allowedLocations
      Object.keys(localData).forEach(key => {
        if (allowedLocations.includes(key)) {
          // If the key is within allowedLocations, store its corresponding value
          matchingValues.push(localData[key]);
        }
      });

      // Flatten the list of localData values
      const flattenedLocalDataValues = Object.values(localData).flat(Infinity);

      // For each allowedLocation, check if it is found in the flattened list of localData values
      allowedLocations.forEach((allowedLocation: unknown) => {
        // Check if allowedLocation is found in the flattened list of localData values
        if (flattenedLocalDataValues.includes(allowedLocation)) {
          // If a match is found, add it to matchingValues
          matchingValues.push(allowedLocation);
        }
      });

      // Flatten the matchingValues array and remove duplicates
      matchingValues = [...new Set(matchingValues.flat())];

      // Add all matching values to the set of aggregatedMatchingValues
      matchingValues.forEach(value => aggregatedMatchingValues.add(value));
      // Set the allowedLocations to the aggregatedMatchingValues
      this.allowedLocations = aggregatedMatchingValues;

      input['allowed-locations'] = matchingValues;
    }

    console.log('#execute()');
    return this.calculate(inputs);
  }


  
 /**
   * Calculates the average score for a given location over the last x days.
   * 
   * @param x The number of days to look back from the current date.
   * @param location The location for which to calculate the average score.
   * @returns The average score for the specified location over the last x days.
   */
 async getAverageScoreForLastXDays(x: number, location: string): Promise<number | null> {
  // Calculate the start date by subtracting x days from the current date
  const toTime = new Date();
  const time = new Date(toTime.getTime() - x * 24 * 60 * 60 * 1000);
  //print the start and finish time
  console.log('Start time:', time.toISOString());
  console.log('Finish time:', toTime.toISOString());
  // Prepare parameters for the API call
  const params = {
    location: location,
    time: time.toISOString(),
    toTime: toTime.toISOString(),
  };

  try {
    // Make the API call to retrieve emissions data
    const response = await this.getResponse('/emissions/bylocations', 'GET', params);
    //print the response
    //console.log('Response for forecast:', response);
    // Check if the response contains data
    if (response && response.length > 0) {
      // Calculate the average score from the response data
      const totalrating = response.reduce((acc: number, curr: { rating: number }) => acc + curr.rating, 0);
      const averagerating = totalrating / response.length;
      return averagerating;
    } else {
      console.log('No data available for the specified location and time frame.');
      return null;
    }
  } catch (error) {
    console.error('Failed to retrieve emissions data:', error);
    throw error;
  }
}

  //this is the function that performs all the api calls and returns the actual results, it is the core of the CarbonAware Advisor model
  async calculate(inputs: ModelParams[]): Promise<ModelParams[]> {
    // Initialize an empty array to hold all suggestions
    // if this.hassampling =true then we need plotted points as well
    let results: ModelParams[] = []
    if (this.hasSampling) {
    results = inputs.map(input => ({
      ...input,
      suggestions: [],
      plotted_points: []
    }));
  }
  else {
    results = inputs.map(input => ({
      ...input,
      suggestions: []
    }));
  }

    const locationsArray = Array.from(this.allowedLocations);
    let byLocationsBestArr: any[] = [];
    let bestArr: any[] = [];
    let suggestedArr: any[] = [];
    
// Define the object with an index signature
  const averageScoresByLocation: { [key: string]: number | null } = {};

  for (const location of locationsArray) {
    // Get the average score for the location for lastDaysNumber days
    const averageScore = await this.getAverageScoreForLastXDays(this.lastDaysNumber, location);

    // Store the average score in the dictionary with the location as the key
    averageScoresByLocation[location] = averageScore;
  }
  
  //if this.hasSampling is true then calculate the allocations
  const allocations: any[] = this.hasSampling ? this.calculateSubrangeAllocation(this.sampling) : [1];
  
  console.log('Allocations:', allocations);
  console.log("Average Scores by Location:", averageScoresByLocation);
  // For each timeframe, get the best response from the API
    for (const [index, timeframe] of Array.from(this.allowedTimeframes).entries()) {
      const currAllocation = allocations[index] - 1;
      let isForecast = false;
      let numOfYears=0;
      let mutableTimeframe: Timeframe = timeframe;
      while(true){
        const params = {
          location: locationsArray,
          time: mutableTimeframe.from,
          toTime: mutableTimeframe.to
        };

        // Returns an array of best EmissionsData objects
        let best = await this.getResponse("/emissions/bylocations", 'GET', params);
        if (best.length > 0) {
          console.log(`API call succeeded for timeframe starting at ${timeframe.from} `);
          //if the api call is a forecast then we need to normalize the values
          if(isForecast){
            best = this.adjustRatingsAndYears(best, numOfYears, averageScoresByLocation);
          }
          
          const minRating = Math.min(...best.map((item: EmissionsData) => item.rating));

          // Step 2: Filter the array to keep only items with the minimum rating
          const itemsWithMinRating = best.filter((item: EmissionsData) => item.rating === minRating);
          byLocationsBestArr = byLocationsBestArr.concat(itemsWithMinRating); // Store minimum response items
          const randomIndex = Math.floor(Math.random() * itemsWithMinRating.length);
          bestArr.push(itemsWithMinRating[randomIndex]); // Store a random best response
          // add all of the items in itemsWithMinRating to the suggestedArr
          suggestedArr = [...suggestedArr, ...itemsWithMinRating];
          
          //if this.hasSampling is true  then we need more than the best value
          if (this.hasSampling) {
            //remove from best array all the elements that are in itemsWithMinRating
            best = best.filter((item: EmissionsData) => !itemsWithMinRating.includes(item));
            //select currAllocation eleemnets at random from the best array
            //and add them to the bestArr
            for (let i = 0; i < currAllocation; i++) {
              const randIndex = Math.floor(Math.random() * best.length);
              bestArr.push(best.splice(randIndex, 1)[0]);
            }
        }
          break;
        }
        // Adjust timeframe by decreasing the year by one
        mutableTimeframe = await this.adjustTimeframeByOneYear(mutableTimeframe);
        //increase the numOfYears we have gone in the pastby 1
        numOfYears++;
        //if we have reached this part of the code then that means that for this timeframe we are forecasting
        isForecast = true; // Set flag since adjustment is needed
      }
      

    }
    
    // Find the lowest rating among all responses
    const lowestRating = Math.min(...suggestedArr.map(item => item.rating));

    // Filter all responses to get items with the lowest rating (i.e. the best responses)
    const lowestRatingItems = suggestedArr.filter(item => item.rating === lowestRating);

    lowestRatingItems.forEach(async item => {
      results[0].suggestions.push({
        'suggested-location': item.location,
        'suggested-timeframe': item.time,
        'suggested-score': item.rating
      });
    });
    if (this.hasSampling) {
      // Set plotted points (all responses from both API calls) if the sampling param has been defined
      bestArr.forEach(async item => {
        results[0].plotted_points.push({
          'location': item.location,
          'time': item.time,
          'score': item.rating
        });
      });
    }
    return results;
  }
  //this function adjusts the ratings and years of the forecasted data
  //it takes the forecasted data, the number of years to add and the average scores by location
  //it returns the adjusted forecasted data
  adjustRatingsAndYears(
    emissionsData: EmissionsData[], 
    yearsToAdd: number, 
    averageScoresByLocation: { [key: string]: number | null }
  ): EmissionsData[] {
    return emissionsData.map(data => {
      const averageRating = averageScoresByLocation[data.location];
      const adjustedRating = averageRating !== null ? (data.rating*0.8 + averageRating*0.2)  : data.rating; // Handle null values
      const time = new Date(data.time);
      time.setFullYear(time.getFullYear() + yearsToAdd);
      return { ...data, rating: adjustedRating, time: time.toISOString() };
    });
  }

  /**
   * Adjust the timeframe by decreasing the year by one.
   * @param timeframe The timeframe to adjust.
   * @returns The adjusted timeframe.
   */
  async adjustTimeframeByOneYear(timeframe: Timeframe): Promise<Timeframe> {
    const adjustYear = (dateString: string): string => {
      const date = new Date(dateString);
      date.setFullYear(date.getFullYear() - 1);
      return date.toISOString();
    };

    return {
      from: adjustYear(timeframe.from),
      to: adjustYear(timeframe.to),
    };
  }

  /**
   * Send a request to the carbon-aware-sdk API to get the list of supported locations.
   */
  private async setSupportedLocations(): Promise<void> {
    // Get the list of supported locations from the carbon-aware-sdk API
      const localData = await this.loadLocations(); 
      // For each key in localData, add the key and its values to the set of supported locations
      Object.keys(localData).forEach(key => {
          const locationsArray = localData[key];
          locationsArray.forEach((location: string) => {
            // Add each server to the set of supported locations
              this.supportedLocations.add(location);   
          });
          // Add each region to the set of supported locations
          this.supportedLocations.add(key);
      });
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
    this.hasSampling = this.sampling > 0; // Set the global flag based on the presence of 'sampling'

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

  //this function calculates the allocation of the samples to the timeframes
  //there must be at least one sample per timeframe
  //if samples < timeframes then an error is thrown
  private calculateSubrangeAllocation(sampling: number) {
    const timeframesCount = this.allowedTimeframes.size;
    if (sampling < timeframesCount) {
        throw new Error("Sampling number too small for the number of timeframes.");
    }

    const durations = Array.from(this.allowedTimeframes).map(timeframe => {
      const start = new Date(timeframe.from).getTime();
      const end = new Date(timeframe.to).getTime();
      return (end - start) / 1000; // Duration in seconds
    });

    const totalDuration = durations.reduce((a, b) => a + b, 0);

    // Initial allocation of 1 sample per timeframe
    let allocations = durations.map(_ => 1);
    let remainingSamples = sampling - timeframesCount; // Adjust remaining samples

    // Proportional allocation of the remaining samples
    if (totalDuration > 0) {
        const remainingDurations = durations.map(duration => duration / totalDuration * remainingSamples);
        for (let i = 0; i < allocations.length; i++) {
            allocations[i] += Math.round(remainingDurations[i]);
        }
    }

    // Redistribution to ensure total matches sampling
    let totalAllocated = allocations.reduce((a, b) => a + b, 0);
    while (totalAllocated !== sampling) {
        if (totalAllocated > sampling) {
            for (let i = 0; i < allocations.length && totalAllocated > sampling; i++) {
                if (allocations[i] > 1) {
                    allocations[i] -= 1;
                    totalAllocated -= 1;
                }
            }
        } else {
            for (let i = 0; i < allocations.length && totalAllocated < sampling; i++) {
                allocations[i] += 1;
                totalAllocated += 1;
            }
        }
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