// import axios from 'axios';
// import { ModelParams } from '@grnsft/if-unofficial-models/build/types/common';
// import { ModelPluginInterface } from '@grnsft/if-unofficial-models/build/interfaces';
// import { buildErrorMessage } from '@grnsft/if-unofficial-models/build/util/helpers';

// import { ERRORS } from '@grnsft/if-unofficial-models/build/util/errors';
// const { InputValidationError } = ERRORS;

// // Make sure you have the 'qs' library installed
// export class CarbonAwareAdvisor implements ModelPluginInterface {
//   /**
//    * Route to the carbon-aware-sdk API. Localhost for now.
//    */
//   private readonly API_URL = "http://localhost:5073";

//   /**
//    * Route to the carbon-aware-sdk API to get the list of supported locations.
//    * {@link https://github.com/Green-Software-Foundation/carbon-aware-sdk/blob/dev/docs/carbon-aware-webapi.md#get-locations}
//    */
//   private readonly LOCATIONS_ROUTE = "/locations";

//   /**
//    * Route to the carbon-aware-sdk API to get the forecast.
//    * {@link https://github.com/Green-Software-Foundation/carbon-aware-sdk/blob/dev/docs/carbon-aware-webapi.md#get-emissionsforecastscurrent}
//    */
//   private readonly FORECAST_ROUTE = "/emissions/forecasts/current";

//   /**
//    * Allowed location parameter that is passed in the config of the model.
//    * The arguments are stored in a set to avoid duplicates.
//    */
//   private readonly ALLOWED_LOCATIONS_PARAM_NAME = 'allowed-locations';
//   private readonly allowedLocations: Set<string> = new Set();

//   /**
//    * Allowed timeframe parameter that is passed in the config of the model.
//    * The arguments are stored in a set to avoid duplicates.
//    */
//   private readonly ALLOWED_TIMEFRAMES_PARAM_NAME = 'allowed-timeframes';
//   private readonly allowedTimeframes: Set<Timeframe> = new Set();

//   /**
//    * List of all locations that are supported by the carbon-aware-sdk.
//    * This is used to validate the inputs provided by the user.
//    * Initialized during configure() using the GET /locations API call.
//    */
//   private readonly supportedLocations: Set<string> = new Set();
//   private hasSampling: boolean = false;
//   private sampling: number = 0;
//   /**
//    * Error builder function that is used to build error messages.
//    */
//   errorBuilder = buildErrorMessage(CarbonAwareAdvisor);

//   async configure(params: object | undefined = undefined): Promise<CarbonAwareAdvisor> {
//     console.log('#configure()');
//     await this.setSupportedLocations();
//     this.validateParams(params);
//     return this;
//   }

//   // async execute(inputs: ModelParams[]): Promise<ModelParams[]> {
//   //   console.log('#execute()');
//   //   this.validateInputs(inputs);

//   //   const results: ModelParams[] = [];
//   //   for (const timeframe of this.allowedTimeframes!) {
//   //     const response = {
//   //       location: 'westus',
//   //       time: '2022-08-01T19:00:00Z',
//   //       rating: 0.5
//   //     }  // TODO: await this.getResponse(fromTime, toTime);

//   //     // For each API call, enrich each input and set allowed-timeframes to the current timeframeonly
//   //     const enrichedInputs = inputs.map(input => ({
//   //       ...input,
//   //       'suggested-location': response.location,
//   //       'suggested-timeframe': response.time,
//   //       'suggested-score': response.rating//,
//   //       // 'allowed-timeframe': `${timeframe.from} - ${timeframe.to}`  // TODO: set to current timeframe only
//   //     }));
//   //     results.push(...enrichedInputs);
//   //   }

//   //   return results;
//   // }

//   async execute(inputs: ModelParams[]): Promise<ModelParams[]> {
//     console.log('#execute()');
//     this.validateInputs(inputs);
//     return this.hasSampling ? this.handleSampling(inputs) : this.handleNoSampling(inputs);
//   }

//   async handleSampling(inputs: ModelParams[]): Promise<ModelParams[]> {
//     // Initialize an empty array to hold all suggestions and plotted points
//     const results: ModelParams[] = inputs.map(input => ({
//       ...input,
//       suggestions: [],
//       plotted_points: []
//     }));

//     const locationsArray = Array.from(this.allowedLocations);
//     let byLocationsBestArr: any[] = [];
//     let byLocationsArr: any[] = [];
//     let bestArr: any[] = [];

//     for (const [index, timeframe] of Array.from(this.allowedTimeframes).entries()) {
//       // Initialize params for the API call
//       const params = {
//         location: locationsArray,
//         time: timeframe.from,
//         toTime: timeframe.to
//       };

//       // Returns an array of best EmissionsData objects
//       const best = await this.getResponse("/emissions/bylocations/best", 'GET', params);
//       if (best.length > 0) {
//         console.log(`API call succeeded for timeframe starting at ${timeframe.from} with response:`, best);
//         byLocationsBestArr = byLocationsBestArr.concat(best); // Store all response items
//         const randomIndex = Math.floor(Math.random() * best.length);
//         bestArr.push(best[randomIndex]); // Store a random best response
//       }

//       // Returns an array of ALL EmissionsData objects
//       let all = await this.getResponse("/emissions/bylocations", 'GET', params);
//       if (all.length > 0) {
//         console.log(`API call succeeded for timeframe starting at ${timeframe.from} with response:`, all);

//         // Calculate the allocation for the current timeframe
//         const allocations: any[] = this.calculateSubrangeAllocation(this.sampling);
//         const currAllocation = allocations[index] - 1;
//         console.log('Allocations:', allocations);

//         // Filter out all responses that are already in allResponses ?
//         all = all.filter((r1: ApiResponse) => !byLocationsBestArr.some(r => r.location === r1.location && r.time === r1.time));

//         for (let i = 0; i < currAllocation; i++) {
//           const randIndex = Math.floor(Math.random() * all.length);
//           bestArr.push(all.splice(randIndex, 1)[0]);
//         }
//         byLocationsArr = byLocationsArr.concat(all); // Store all response items
//       }
//     }

//     // Find the lowest rating among all responses
//     const lowestRating = Math.min(...byLocationsBestArr.map(item => item.rating));

//     // Filter all responses to get items with the lowest rating (i.e. the best responses)
//     const lowestRatingItems = byLocationsBestArr.filter(item => item.rating === lowestRating);

//     // Set suggestions
//     lowestRatingItems.forEach(item => {
//       results[0].suggestions.push({
//         'suggested-location': item.location,
//         'suggested-timeframe': item.time,
//         'suggested-score': item.rating
//       });
//     });

//     // Set plotted points (all responses from both API calls)
//     bestArr.forEach(item => {
//       results[0].plotted_points.push({
//         'location': item.location,
//         'time': item.time,
//         'score': item.rating
//       });
//     });

//     return results;
//   }

//   async handleNoSampling(inputs: ModelParams[]): Promise<ModelParams[]> {
//     // Initialize an empty array to hold all suggestions
//     const results: ModelParams[] = inputs.map(input => ({
//       ...input,
//       suggestions: []
//     }));

//     const locationsArray = Array.from(this.allowedLocations);
//     let byLocationsBestArr: any[] = [];
//     let bestArr: any[] = [];

//     for (const [_, timeframe] of Array.from(this.allowedTimeframes).entries()) {
//       // Initialize params for the API call
//       const params = {
//         location: locationsArray,
//         time: timeframe.from,
//         toTime: timeframe.to
//       };

//       // Returns an array of best EmissionsData objects
//       const best = await this.getResponse("/emissions/bylocations/best", 'GET', params);
//       if (best.length > 0) {
//         console.log(`API call succeeded for timeframe starting at ${timeframe.from} with response:`, best);
//         byLocationsBestArr = byLocationsBestArr.concat(best); // Store all response items
//         const randomIndex = Math.floor(Math.random() * best.length);
//         bestArr.push(best[randomIndex]); // Store a random best response
//       }
//     }

//     // Find the lowest rating among all responses
//     const lowestRating = Math.min(...byLocationsBestArr.map(item => item.rating));

//     // Filter all responses to get items with the lowest rating (i.e. the best responses)
//     const lowestRatingItems = byLocationsBestArr.filter(item => item.rating === lowestRating);

//     // Set suggestions
//     lowestRatingItems.forEach(item => {
//       results[0].suggestions.push({
//         'suggested-location': item.location,
//         'suggested-timeframe': item.time,
//         'suggested-score': item.rating
//       });
//     });

//     return results;
//   }

//   /**
//    * Send a request to the carbon-aware-sdk API to get the list of supported locations.
//    */
//   private async setSupportedLocations(): Promise<void> {
//     const data = await this.getResponse(this.LOCATIONS_ROUTE);
//     Object.keys(data)
//       .map((key: string) => data[key].name)
//       .forEach((location: string) => {
//         this.supportedLocations.add(location);
//       });
//       // Add each region to the set of supported locations
//       this.supportedLocations.add(key);
//     });
//   }

//   /**
//    * Task 1: Write the logic that decides whether we are forecasting or not. (validate inputs properly, check if
//    * every date is in the future, etc.)
//    * 
//    * Task 2: Implement actual forecast, if we are within 3 days in future call the /forecast endpoint,
//    * otherwise perform weighted historical prediction.
//    */
//   private async getForecast(location: string[], timeframes: Timeframe[]): Promise<any> {
//     // Find each unique combination of location and timeframe
//     const combinations = this.cartesianProduct(location, timeframes);

//     // TODO: Call on the first one only, for now
//     await this.getForecastForLocationAndTimeframe(combinations[0][0], combinations[0][1]);
//   }

//   /**
//    * Builds a forecast for a given location and timeframe by querying the carbon-aware-sdk API for the last 5 years
//    * @param location Location 
//    * @param timeframe Timeframe
//    * @returns Forecast
//    */
//   private async getForecastForLocationAndTimeframe(location: string, timeframe: Timeframe): Promise<Forecast> {
//     const map: Map<Timeframe, ApiResponse> = new Map(); // Map of ttimeframes to scores

//     let from = new Date(timeframe.from);
//     let to = new Date(timeframe.to);

//     for (let i = 0; i < this.historyYears; i++) {
//       const timeframe = {
//         from: from.toISOString(),
//         to: to.toISOString()
//       }
//       console.log(`Forecast for ${location} on ${JSON.stringify(timeframe)}`);

//       const response: ApiResponse[] = await this.getResponse('/emissions/bylocations/best', 'GET', {
//         location: location,
//         time: from.toISOString(),
//         toTime: to.toISOString()
//       });
//       map.set(timeframe, response[0]);
//       // Shift by one year to past
//       from.setFullYear(from.getFullYear() - 1);
//       to.setFullYear(to.getFullYear() - 1);
//     }

//     console.log(map);

//     // Calculate the prediction
//     const forecast = this.forecast(location, timeframe, map);
//     console.log(`Forecast`);
//     console.log(forecast);

//     return forecast;
//   }

//   /**
//    * Returns a forecast for a given location and timeframe. The forecast is a weighted average of the scores of the
//    * responses, where the weights are determined by the decay factor.
//    * For example if the scores are [2023=5, 2022=4, 2021=3, 2020=2, 2019=1], the forecast is:
//    * (1*5 + 0.95 * 4 + 0.95^2 * 3 + 0.95^3 * 2 + 0.95^4 * 1) / (1 + 0.95 + 0.95^2 + 0.95^3 + 0.95^4)
//    * 
//    * @param location Location, e.g. 'eastus'
//    * @param timeframe Timeframe, e.g. { from: '2023-01-01T00:00:00.000Z', to: '2023-12-31T23:59:59.999Z' }
//    * @param map Map of timeframes to scores, e.g. { 2023: 5, 2022: 4, 2021: 3, 2020: 2, 2019: 1 }
//    * @returns Forecast, e.g. { location: 'eastus', timeframe: { from: ..., to: ... }, rating: 4.5, n: 5, decay: 0.95 }
//    */
//   private forecast(location: string, timeframe: Timeframe, map: Map<Timeframe, ApiResponse>): Forecast {
//     const decayFactor = 0.95;
//     let i = 0;
//     let weightedSum = 0;
//     let weightSum = 0;

//     for (const [_, response] of map) {
//       const decay = Math.pow(decayFactor, i);
//       // rating * 0.95^i, otherwise 0
//       weightedSum += response ? (response.rating * decay) : 0;
//       weightSum += decay; // 1 + 0.95 + 0.95^2 + ...
//       i++;
//     }

//     return {
//       location: location,
//       timeframe: timeframe,
//       rating: weightedSum / weightSum,
//       n: map.size,
//       decay: decayFactor
//     };
//   }


//   /**
//    * Send a request to the carbon-aware-sdk API.
//    * @param route The route to send the request to.
//    * @param method The HTTP method to use.
//    * @param params The map of parameters to send with the request.
//    * @returns The response from the API of any type.
//    * @throws Error if the request fails and stops the execution of the model.
//    */
//   private async getResponse(route: string, method: string = 'GET', params: any = null): Promise<any> {
//     const url = new URL(`${this.API_URL}${route}`);

//     // Manually serialize params to match the required format: 'location=eastus&location=westus&...'
//     let queryString = '';
//     if (params) {
//       queryString = Object.entries(params).map(([key, value]) => {
//         if (Array.isArray(value)) {
//           // Convert each value to a string before encoding and repeat the key for each value in the array
//           return value.map(v => `${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`).join('&');
//         } else {
//           // Convert value to a string before encoding and directly append to query string
//           return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
//         }
//       }).join('&');
//     }

//     const finalUrl = `${url}${queryString ? '?' + queryString : ''}`;
//     // console.log(`Sending ${method} request to ${finalUrl}`);

//     return axios({
//       url: finalUrl,
//       method: method,
//     }).then((response) => {
//       return response.data;
//     }).catch((error) => {
//       console.error(error);
//       this.throwError(Error, error.message);
//     });
//   }

//   private validateInputs(inputs: ModelParams[]): void {
//     console.log(JSON.stringify(inputs));

//     // Check null
//     if (inputs === undefined) {
//       this.throwError(InputValidationError, 'Required Parameters not provided');
//     }

//     if (!Array.isArray(inputs)) {
//       this.throwError(InputValidationError, 'Inputs must be an array');
//     }
//   }

//   private validateParams(params: object | undefined): void {
//     console.log(JSON.stringify(params));

//     // Check null
//     if (params === undefined) {
//       this.throwError(InputValidationError, 'Required Parameters not provided');
//     }

//     // Parse parameters as map
//     const map = new Map(Object.entries(params!));
//     this.validateLocations(map);
//     this.validateTimeframes(map);
//     this.validateSampling(map);
//   }

//   private validateSampling(map: Map<string, any>): void {
//     this.sampling = map.get('sampling');
//     this.hasSampling = this.sampling > 0; // Set the global flag based on the presence of 'sampling'

//     if (this.hasSampling && (typeof this.sampling !== 'number' || this.sampling <= 0)) {
//       console.warn('`sampling` provided but not a positive number. Ignoring `sampling`.');
//     }
//   }

//   private validateLocations(map: Map<string, any>): void {
//     const allowedLocations = map.get(this.ALLOWED_LOCATIONS_PARAM_NAME);
//     if (allowedLocations === undefined) {
//       this.throwError(InputValidationError,
//         `Required Parameter ${this.ALLOWED_LOCATIONS_PARAM_NAME} not provided`);
//     }
//     if (!Array.isArray(allowedLocations) || allowedLocations.length === 0) {
//       this.throwError(InputValidationError,
//         `Required Parameter ${this.ALLOWED_LOCATIONS_PARAM_NAME} is empty`);
//     }

//     // For each location provided, check if it is supported (i.e. in the list of supported locations)
//     allowedLocations.forEach((location: string) => {
//       if (!this.supportedLocations.has(location)) {
//         this.throwError(InputValidationError,
//           `Location ${location} is not supported`);
//       }
//       this.allowedLocations.add(location);
//     });
//   }

//   private calculateSubrangeAllocation(sampling: number) {
//     const durations = Array.from(this.allowedTimeframes).map(timeframe => {
//       const start = new Date(timeframe.from).getTime();
//       const end = new Date(timeframe.to).getTime();
//       return (end - start) / 1000; // Duration in seconds

//       return (end - start) / 1000; // Duration in seconds
//     });

//     const totalDuration = durations.reduce((a, b) => a + b, 0);
//     let allocations = durations.map(duration =>
//       Math.round(sampling * (duration / totalDuration))
//     );

//     // Adjust allocations to ensure the sum equals sampling
//     while (allocations.reduce((a, b) => a + b, 0) > sampling) {
//       const maxIndex = allocations.indexOf(Math.max(...allocations));
//       allocations[maxIndex] -= 1;
//     }
//     while (allocations.reduce((a, b) => a + b, 0) < sampling) {
//       const minIndex = allocations.indexOf(Math.min(...allocations));
//       allocations[minIndex] += 1;
//     }

//     return allocations;
//   }

//   private validateTimeframes(map: Map<string, any>): void {
//     const timeframes = map.get(this.ALLOWED_TIMEFRAMES_PARAM_NAME);
//     if (timeframes === undefined) {
//       this.throwError(InputValidationError,
//         `Required Parameter ${this.ALLOWED_TIMEFRAMES_PARAM_NAME} not provided`);
//     }
//     if (!Array.isArray(timeframes) || timeframes.length === 0) {
//       this.throwError(InputValidationError,
//         `Required Parameter ${this.ALLOWED_TIMEFRAMES_PARAM_NAME} is empty`);
//     }

//     // For each timeframe provided, check if it is valid and add it to the set of allowed timeframes
//     timeframes.forEach((timeframe: string) => {
//       // For each timeframe provided, check if it is valid
//       const [from, to] = timeframe.split(' - ');
//       if (from === undefined || to === undefined) {
//         this.throwError(InputValidationError,
//           `Timeframe ${timeframe} is invalid`);
//       }
//       // Check if start is before end
//       if (from >= to) {
//         this.throwError(InputValidationError,
//           `Start time ${from} must be before end time ${to}`);
//       }
//       this.allowedTimeframes.add({
//         from: from,
//         to: to
//       });
//     });
//   }

//   private throwError(type: ErrorConstructor, message: string) {
//     throw new type(this.errorBuilder({ message }));
//   }

//   /**
//    * Returns the cartesian product of two arrays (string and Timeframe). 
//    * If locations size is n, and dates size is m, the result will be an array of size n * m.
//    * @param locations List of allowed locations
//    * @param dates List of allowed timeframes
//    * @returns Array of tuples, where each tuple contains a location and a timeframe. 
//    */
//   private cartesianProduct(locations: string[], dates: Timeframe[]): Array<[string, Timeframe]> {
//     const product: Array<[string, Timeframe]> = [];
//     for (const str of locations) {
//       for (const date of dates) {
//         product.push([str, date]);
//       }
//     }
//     return product;
//   }
// }