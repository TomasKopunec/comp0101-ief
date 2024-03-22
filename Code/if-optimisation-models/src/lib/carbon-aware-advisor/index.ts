import axios from 'axios';
import { PluginInterface } from '../../interfaces';
import { ConfigParams, PluginParams } from '../../types/common';
import { buildErrorMessage } from '../../util/helpers';
import { ERRORS } from '../../util/errors';
import { promises as fsPromises } from 'fs';
import * as path from 'path';


// Make sure you have the 'qs' library installed
export const CarbonAwareAdvisor = (params: ConfigParams): PluginInterface => {
  const { InputValidationError } = ERRORS; //used for exceptions

  interface EmissionsData { //interface for the emissions data returned by the API
    location: string;
    time: string;
    rating: number;
    duration: string;
  }

  const metadata = {  //necessary metadata returrned by the new version of the impact engine interface
    kind: 'execute'
  };

  /**
   * Route to the carbon-aware-sdk API. Localhost for now.
   */
  const API_URL = "http://host.docker.internal:5073";

  /**
   * Allowed location parameter that is passed in the config of the model.
   * The arguments are stored in a set to avoid duplicates.
   * the actual locations will populate this set during execution after certain checks
   */

  let allowedLocations: Set<string> = new Set();

  /**
   * Allowed timeframe parameter that is passed in the config of the model.
   * The arguments are stored in a set to avoid duplicates.
   * the actual timeframes will populate this set during execution after certain checks
   */
  let allowedTimeframes: Set<Timeframe> = new Set();

  /**
   * List of all locations that are supported by the carbon-aware-sdk.
   * This is used to validate the inputs provided by the user.
   * Initialized by reading the locations.json file in the setSupportedLocations() function.
   */
  let supportedLocations: Set<string> = new Set();
  // Use for read from locations.json . We need to be careful when we commit to the impact framework dir for this path
  let locationsFilePath = path.join(__dirname, 'locations.json');


  //flag to check if the model has sampling, the sampling value is originally set to 0
  let hasSampling: boolean = false;
  let sampling: number = 0;

  //number of last days to get average score
  const lastDaysNumber: number = 10;

  //weights for the forecasting, the first weight is that of the average of last 10 days and the second weight is that of the last available year on that date
  //the weights must sum to 1
  const weights = [0.5, 0.5];


  //Error builder function that is used to build error messages. 
  let errorBuilder = buildErrorMessage('CarbonAwareAdvisor');


  /**
  * this function is the main function of the model, it is called by the impl file
  * it takes the inputs from the impl file and returns the results of the model
  * it validates them that all the required parameters are provided and are of the correct type
  * and then calls the calculate function to perform the actual calculations
  * @param inputs the inputs from the impl file
  * @returns the results of the model
  */
  const execute = async (inputs: PluginParams[]) => {
    // await validateInputs(configs);
    //echo that you are in the execute function
    await validateInputs();
    console.log('You are in the execute function');
    //call the calculate function to perform the actual calculations
    return await calculate(inputs);
  }

  /**
  * this is the function that performs all the api calls and returns the actual results, 
  * it is the core of the CarbonAware Advisor model and it is called by the execute function
  */
  const calculate = async (inputs: PluginParams[]): Promise<PluginParams[]> => {
    //depending on if we have sampling or not the result map that will be returned will be different. 
    //if hassampling =true then we need plotted points as well

    let results: PluginParams[] = []
    if (hasSampling) {
      results = inputs.map(input => ({
        ...input,
        suggestions: [],
        'plotted-points': []
      }));
    }
    else {
      results = inputs.map(input => ({
        ...input,
        suggestions: []
      }));
    }
    // create an array from the global locationsArray set that was populated during the validation of the inputs
    const locationsArray = [...allowedLocations];
    let BestData: any[] = [];
    let plotted_points: any[] = [];
    let AllBestData: any[] = [];

    // We define a map averageScoresByLocation to find the average score for each location for the last lastDaysNumber days
    const averageScoresByLocation: { [key: string]: number | null } = {};

    // For each location, get the average score for the last lastDaysNumber days
    for (const location of locationsArray) {
      console.log(`Getting average score for location ${location} over the last ${lastDaysNumber} days`);
      // Get the average score for the location for lastDaysNumber days
      const averageScore = await getAverageScoreForLastXDays(lastDaysNumber, location);

      // Store the average score in the dictionary with the location as the key
      averageScoresByLocation[location] = averageScore;
    }

    //if we have sampling then calculate the allocations of the plotted points per timeframe
    const allocations: any[] = hasSampling ? calculateSubrangeAllocation(sampling) : [1];

    //Print the allocations and the average scores by location
    console.log('Allocations:', allocations);
    console.log("Average Scores by Location:", averageScoresByLocation);

    // For each timeframe, get the response from the API
    for (const [index, timeframe] of Array.from(allowedTimeframes).entries()) {
      // Get the current allocation for that timeframe (how many plotted points we need to extract from that specific timeframe)
      const currAllocation = allocations[index] - 1;
      //isForecast is a variable telling us if the current timeframe is in the future (meanin that there is no data from the APi for that timeframe)
      let isForecast = false;
      //numOfYears is a variable that tells us how many years we have gone in the past to find data for that forecast
      let numOfYears = 0;
      let mutableTimeframe: Timeframe = timeframe;
      while (true) {
        // Prepare parameters for the API call
        const params = {
          location: locationsArray,
          time: mutableTimeframe.from,
          toTime: mutableTimeframe.to
        };
        //if params,time and params.toTime are before now we dont have a forecast
        if (params.time < new Date().toISOString() && params.toTime < new Date().toISOString()) {

          // Returns an array of all EmissionsData objects for that timeframe and locations
          let api_response = await getResponse("/emissions/bylocations", 'GET', params);
          if (api_response.length > 0) {
            console.log(`API call succeeded for timeframe starting at ${timeframe.from} `);
            //if the api call is a forecast then we need to normalize the values to change the year and the rating
            //for example if we made a forecat for 2025 and we are in 2023 then we need to adjust the year back to 2025 and the rating based on the weights
            if (isForecast) {
              api_response = adjustRatingsAndYears(api_response, numOfYears, averageScoresByLocation);
            }
            //the minRating is the rating from the EmissionsData  of the response that is the lowest
            const minRating = Math.min(...api_response.map((item: EmissionsData) => item.rating));

            // here we find all the EmissionsData objects from the response that have the lowest rating
            const itemsWithMinRating = api_response.filter((item: EmissionsData) => item.rating === minRating);

            // We store  that  EmissionsData objects from the response that have the lowest rating
            BestData = BestData.concat(itemsWithMinRating);

            //if we have sampling then we need to store the one (at random) of the minimum EmissionsData objects to be returned in the plotted points
            const randomIndex = Math.floor(Math.random() * itemsWithMinRating.length);
            plotted_points.push(itemsWithMinRating[randomIndex]);

            // All of the EmissionsData objects from the response that have the lowest rating are stored in AllBestData, where the best of all api calls will be stored
            AllBestData = [...AllBestData, ...itemsWithMinRating];

            //if hasSampling is true  then we need more than the best value, we need some extra values to be returned in the plotted points (as many as the allocation says)
            if (hasSampling) {
              //remove from best array all the elements that are in itemsWithMinRating, we have already stored one of them
              api_response = api_response.filter((item: EmissionsData) => !itemsWithMinRating.includes(item));
              //select currAllocation elemnets at random from the remaining items in the api_response array
              //and add them to the plotted_points
              for (let i = 0; i < currAllocation; i++) {
                const randIndex = Math.floor(Math.random() * api_response.length);
                plotted_points.push(api_response.splice(randIndex, 1)[0]);
              }
            }
            break; // Break the loop if we have found data for the current timeframe and locations and search for the next timeframe
          }
        }
        //if we have reached this part of the code then that means that for this timeframe we are forecasting
        isForecast = true;
        // Adjust timeframe by decreasing the year by one to do an API call for the previous year the enxt time
        mutableTimeframe = await adjustTimeframeByOneYear(mutableTimeframe);
        //increase the numOfYears we have gone in the past by 1
        numOfYears++;
        if (numOfYears > 5) {// if you cant find any data 5 years in the past then stop searching
          break;
        }
      }
    }

    // In the AllBestData we have the best values from all the api calls (so for each timeframe), we need to return the best of the best.
    const lowestRating = Math.min(...AllBestData.map(item => item.rating));
    // Filter all responses to get items with the lowest rating (i.e. the best responses)
    const finalSuggestions = AllBestData.filter(item => item.rating === lowestRating);

    // Store the final suggestions in the output results
    results[0].suggestions = finalSuggestions;

    // If we have sampling in the result we return the plotted points as well which have samples from different timeframe and locations
    if (hasSampling) {
      results[0]['plotted-points'] = plotted_points;
    }
    return results;
  }

  /**
  * this function adjusts the ratings and years of the forecasted data
  * it takes the forecasted data, the number of years to add and the average scores by location
  * it returns the adjusted forecasted data 
  @param emissionsData The emissions that need  to be adjustes.
  @param yearsToAdd how many years in the future the forecast is
  @param averageScoresByLocation the average scores by location for the last 10 days
  */
  const adjustRatingsAndYears = (
    emissionsData: EmissionsData[],
    yearsToAdd: number,
    averageScoresByLocation: { [key: string]: number | null }
  ): EmissionsData[] => {
    return emissionsData.map(data => {
      //get the average rating for the specific location
      const averageRating = averageScoresByLocation[data.location];
      //if the average rating is null then we dont have data for the last 10 days for that location
      //and we will base the rating only on the old value (not normalise based on the last 10 days average rating)
      //adjust the rating of this location based on the weights
      const adjustedRating = averageRating !== null ? (data.rating * weights[0] + averageRating * weights[1]) : data.rating; // Handle null values
      //create the new date by making the year equal to the year of the forecast(by adding the years we have gone in the past)
      const time = new Date(data.time);
      time.setFullYear(time.getFullYear() + yearsToAdd);
      //return the adjusted data
      return { ...data, rating: adjustedRating, time: time.toISOString() };
    });
  }

  /**
   * Adjust the timeframe by decreasing the year by one.
   * @param timeframe The timeframe to adjust.
   * @returns The adjusted timeframe which is one year in the past
   * we need this function to adjust the timeframe if the timeframe is in the future and we need to perform an api call in the past
   */
  const adjustTimeframeByOneYear = (timeframe: Timeframe): Timeframe => {
    // Adjust the year of the timeframe by decreasing it by one
    const adjustYear = (dateString: string): string => {
      const date = new Date(dateString);
      date.setFullYear(date.getFullYear() - 1);
      return date.toISOString();
    };
    //return the adjusted timeframe by decreasing the year by one for the start of the timeframe and the end of the timeframe
    return {
      from: adjustYear(timeframe.from),
      to: adjustYear(timeframe.to),
    };
  }

  /**
   * Set the supported locations based on the locations.json file
   * the supported locations are the locations that the model can perform api calls for
   * but also include key word regions (such as europe) that are sets of multiple locations
   */
  const setSupportedLocations = async (): Promise<void> => {
    // Get the list of supported locations from the locarions.json file
    const localData = await loadLocations();
    // For each region in localData,  and the locations of that region to the set of supported locations
    Object.keys(localData).forEach(key => {
      const locationsArray = localData[key];
      locationsArray.forEach((location: string) => {
        // Add each server to the set of supported locations
        supportedLocations.add(location);
      });
      // Add each region itself to the set of supported locations
      supportedLocations.add(key);
    });
  }

  /**
   * Send a request to the carbon-aware-sdk API.
   * @param route The route to send the request to. We mostly use '/emissions/bylocations' to get the emissions data
   * @param method The HTTP method to use.
   * @param params The map of parameters to send with the request.
   * @returns The response from the API of any type.
   * @throws Error if the request fails and stops the execution of the model.
   */
  const getResponse = async (route: string, method: string = 'GET', params: any = null): Promise<any> => {
    const url = new URL(`${API_URL}${route}`);

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
    //the final url is the url of the api call we will be performing
    const finalUrl = `${url}${queryString ? '?' + queryString : ''}`;
    console.log(`Sending ${method} request to ${finalUrl}`);

    let attempts = 0;
    const maxAttempts = 3; // Initial attempt + 2 retries if we get error 500 from the API

    while (attempts < maxAttempts) {
      try {
        const response = await axios({
          url: finalUrl,
          method: method,
        });
        //if the api call is successful then return the data
        return response.data;
      } catch (error) {
        //if we get an error from the api
        attempts++;

        // Use a type guard to check if the error is an AxiosError
        if (axios.isAxiosError(error)) {
          const axiosError = error;
          console.error(axiosError.message);
          //if we get error 500 then retry the api call up to 2 more times
          if (axiosError.response && axiosError.response.status === 500 && attempts < maxAttempts) {
            console.log(`Attempt ${attempts} failed with status 500. Retrying...`);
          } else {
            console.log()
            throwError(Error, axiosError.message);
          }
        } else {
          // If it's not an AxiosError, it might be some other error (like a network error, etc.)
          throwError(Error, 'An unexpected error occurred');
        }
      }
    }
  };

  /**
   * Validate the inputs provided by the user to make sure that all required parameters are provided and are of the correct type.
   * @param inputs The inputs provided by the user.
   * @throws InputValidationError if the inputs are invalid and stops the execution of the model.
   */
  const validateInputs = async () => {
    console.log('Input validation: ', JSON.stringify(params, null, 2));
    if (params === undefined || params === null || Object.keys(params).length === 0) {
      throwError(InputValidationError, 'Required Parameters not provided');
    }

    await setSupportedLocations(); // Set the supported locations based on the locations.json file to see if the locations we got as inputs are among them
    validateParams(); // Validate params
    console.log('Validation complete.')
  };

  /**
   * Validate the inputs provided by the user to make sure that all required parameters are provided and are of the correct type.
   * Here we are sure that some inputs have been provided and we have set the supported locations
   * @param params The inputs provided by the user in the impl file
   * @throws InputValidationError if the inputs are invalid and stops the execution of the model.
   */
  const validateParams = () => {
    //print the params received from the impl file for debugging puproses
    //console.log("The params received from the impl:",JSON.stringify(params));

    // Check if the 'allowed-locations' property exists in the impl file
    if (params && params['allowed-locations'] !== undefined) {
      const locs = params['allowed-locations'];
      // validate that the locations are corect
      validateLocations(locs);
    }
    else {
      throwError(InputValidationError, `Required Parameter allowed-locations not provided`);
    }
    // Check if the 'allowed-timeframes' property exists in the impl file
    if (params && params['allowed-timeframes'] !== undefined) {
      const times = params['allowed-timeframes'];
      // validate that the timeframes are correct
      validateTimeframes(times);
    } else {
      throwError(InputValidationError, `Required Parameter allowed-timeframes not provided`);
    }

    // Check if the 'sampling' property exists in the impl file
    if (params && params['sampling'] !== undefined) {
      const sample = params['sampling'];
      // Further processing with locs
      console.log('`sampling` provided:', sample);
      validateSampling(sample);
    } else {
      console.log('Sampling not provided, ignoring');
    }
  };

  /**
   * Validate the sampling parameter to make sure that it is a positive number.
   * @param sampling The sampling parameter provided by the user.
   * @throws InputValidationError if the sampling parameter is invalid and stops the execution of the model.
   * @returns void
   */
  const validateSampling = (sample: any): void => {
    // Check if sampling is a positive number  and populate the global params hasSampling and sampling
    hasSampling = sample > 0;
    sampling = sample;

    if (!hasSampling || typeof sampling !== 'number' || sampling <= 0) {
      console.warn('`sampling` provided but not a positive number. Ignoring `sampling`.');
    }
  };

  /**
  * Validate the allowed-locations parameter to make sure that it is an array of locations
  * and that those locations are supported
  * @param locs The array of allowed locations provided by the user in the impl
  * @throws InputValidationError if the allowed locations parameter is invalid or some of the locations are unsupported and stops the execution of the model.
  * @returns void
  */
  const validateLocations = (locs: any): void => {
    if (!Array.isArray(locs) || locs.length === 0) {
      throwError(InputValidationError, `Required Parameter 'allowed-locations' is empty`);
    }

    locs.forEach((location: string) => {
      //check that the locations in the impl are some of the supported locations
      if (!supportedLocations.has(location)) {
        throwError(InputValidationError, `Location ${location} is not supported`);
      }
      allowedLocations.add(location); // populate the global set of allowedLocations
    });
  };

  /**
  * Validate the allowed-timeframes parameter to make sure that it is an array of timeframes
  * and that those timeframes are valid
  * @param timeframes The array of allowed timeframes provided by the user in the impl
  * @throws InputValidationError if the allowed timeframes parameter is invalid or some of the timeframes are invalid and stops the execution of the model.
  * @returns void
  */
  const validateTimeframes = (timeframes: any): void => {
    if (!Array.isArray(timeframes) || timeframes.length === 0) {
      throwError(InputValidationError,
        `Required Parameter allowed-timeframes is empty`);
    }

    // For each timeframe provided, check if it is valid and add it to the set of allowed timeframes
    timeframes.forEach((timeframe: string) => {
      // For each timeframe provided, check if it is valid
      const [from, to] = timeframe.split(' - ');
      if (from === undefined || to === undefined) {
        throwError(InputValidationError,
          `Timeframe ${timeframe} is invalid`);
      }

      // Check if the start and end times are valid dates
      if (isNaN(Date.parse(from)) || isNaN(Date.parse(to))) {
        throwError(InputValidationError,
          `Timeframe ${timeframe} is invalid`);
      }

      // Check if start is before end
      if (from >= to) {
        throwError(InputValidationError,
          `Start time ${from} must be before end time ${to}`);
      }
      allowedTimeframes.add({  //add this valid timeframe to the global set allowedTimeframes
        from: from,
        to: to
      });
    });
  }

  /**
   * this function calculates the allocation of the samples to the timeframes
   * there must be at least one sample per timeframe
   * if samples < number of timeframes then an error is thrown
   * @param sampling the number of samples needed
   * @returns the allocation of the samples to the timeframes meaning how many samples we must select from each timeframe 
   * in order to have a unifrom distribution of the samples 
   * (for example if one timeframe is very long we will select more samples from it than from a shorter timeframe)
   */
  const calculateSubrangeAllocation = (sampling: number) => {
    //if samples < number of timeframes then an error is thrown
    const timeframesCount = allowedTimeframes.size;
    if (sampling < timeframesCount) {
      throw new Error("Sampling number too small for the number of timeframes.");
    }

    //returns the duration of each timeframe
    const durations = Array.from(allowedTimeframes).map(timeframe => {
      const start = new Date(timeframe.from).getTime();
      const end = new Date(timeframe.to).getTime();
      return (end - start) / 1000; // Duration in seconds
    });

    //the total duration is the sum of all the durations
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

  /**
   * this function throws an error of a specific type and message
   * @param type the type of the error
   * @param message the message of the error
   * @throws the error of the specific type and message
   * @returns void
   */
  const throwError = (type: ErrorConstructor, message: string) => {
    throw new type(errorBuilder({ message }));
  }

  /**
   * this function loads the locations from the locations.json file
   * @returns the locations object from the locations.json file
   */
  const loadLocations = async () => {
    try {
      //get the data from the locations.json file
      const data = await fsPromises.readFile(locationsFilePath, 'utf-8');
      const locationsObject = JSON.parse(data);
      return locationsObject;
    } catch (error) {
      throw new Error("Failed to read from locations.json. Please check the file and its path and try again.");
    }
  }

  /**
  * Calculates the average score for a given location over the last days days.
  * 
  * @param days The number of days to look back from the current date.
  * @param location The location for which to calculate the average score.
  * @returns The average score for the specified location over the last days days.
  */
  const getAverageScoreForLastXDays = async (days: number, location: string): Promise<number | null> => {
    // Calculate the start date by subtracting days number of days from the current date
    const toTime = new Date();
    const time = new Date(toTime.getTime() - days * 24 * 60 * 60 * 1000);
    //print the start and finish time
    console.log('Start time for the average score of the last:', days, 'number of days is: ', time.toISOString());
    console.log('Finish time for the average score of the last:', days, 'number of days is: ', toTime.toISOString());
    // Prepare parameters for the API call
    const params = {
      location: location,
      time: time.toISOString(),
      toTime: toTime.toISOString(),
    };

    try {
      // Make the API call to retrieve emissions data for the last 10 days for the specified location
      const response = await getResponse('/emissions/bylocations', 'GET', params);

      // Check if the response contains data
      if (response && response.length > 0) {
        // Calculate the average score from the response data
        const totalrating = response.reduce((acc: number, curr: { rating: number }) => acc + curr.rating, 0);
        const averagerating = totalrating / response.length;
        return averagerating;
      } else {
        // no data available for the specified location and time frame
        console.log('No data available for thethe last ', days, 'days for location:', location,);
        console.log('Returning null so potential issue if you perfom forecasting for this location');
        return null;
      }
    }
    catch (error) {
      console.error('Failed to retrieve emissions data:', error);
      throw error;
    }
  }

  // the CarbonAwareAdvisor returns the metadata and the execute function
  // so that eans that every time this model is run the execute function will be called
  return {
    metadata,
    execute,
    getAverageScoreForLastXDays,
    supportedLocations
  };
}
