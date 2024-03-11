import { CarbonAwareAdvisor } from "../../../lib/carbon-aware-advisor";
import { ConfigParams, PluginParams } from "../../../types/common";
import { PluginInterface } from "../../../interfaces";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import 'jest-expect-message';
const mock = new MockAdapter(axios);

/**
* To run: npm run test -- src/tests/models/CarbonAdvisorModel.test.ts
*/

/**
 * Import scenarios
 */
import scenario1 = require("./scenarios/scenario1.json");
import scenario2 = require("./scenarios/scenario2.json");
import scenario3 = require("./scenarios/scenario3.json");
import scenario4 = require("./scenarios/scenario4.json");
import scenario5 = require("./scenarios/scenario5.json");
import scenario6 = require("./scenarios/scenario6.json");
import scenario7 = require("./scenarios/scenario7.json");
import scenario8 = require("./scenarios/scenario8.json");
import scenario9 = require("./scenarios/scenario9.json");
import scenario10 = require("./scenarios/scenario10.json");

import locations = require("../../../lib/carbon-aware-advisor/locations.json");

function initMock(scenario: any) {
    mock.onGet(new RegExp('/emissions/bylocations')).reply(200, scenario);
}

function initMockWithParams(data: Suggestion[], location: string, from: string, to: string) {
    let queryString = '';
    const params = {
        location: location,
        time: from,
        toTime: to
    };
    const fromDate = new Date(from);
    const toDate = new Date(to);

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
    const finalUrl = `/emissions/bylocations${queryString ? '?' + queryString : ''}`;

    // Match this: emissions/bylocations?location=eastus&time=2024-01-03T04%3A00%3A00Z&toTime=2024-01-03T20%3A00%3A00Z
    console.log(finalUrl);

    mock.onGet(finalUrl).reply(200, data.filter((item: Suggestion) => {
        const locFrom = new Date(item.time);
        const locTo = new Date(item.time);
        return item.location === location
            && fromDate >= locFrom && toDate <= locTo;
    }));
}

function mockAverage(model: PluginInterface, value: number) {
    jest.spyOn(model, 'getAverageScoreForLastXDays').mockImplementation(() => {
        console.log("Mocking average score");
        return Promise.resolve(value);
    });
}

describe('CarbonAdvisorModel.Basic', () => {
    /**
     * Scenario 1: Find best time for 15/01/2024 in eastus between 12:00 and 18:00 (no sampling)
     * Expected: Suggest the time of 11:30 with score 1
     * Note: Contains single surrounding data point (+- one day) with negative value (boundary testing)
     */
    it('CarbonAdvisorModel.Scenario1', async () => {
        initMock(scenario1);
        const config: ConfigParams = {
            "allowed-locations": ["eastus"],
            "allowed-timeframes": ["2024-01-15T12:00:00Z - 2024-01-15T18:00:00Z"]
        };
        const inputs: PluginParams[] = [{
            "timestamp": "",
            "duration": 1
        }];
        const model = CarbonAwareAdvisor(config);
        mockAverage(model, 5);

        const result = await model.execute(inputs);
        const suggestions = validateSuggestions(result, config);

        expect(suggestions.length).toBe(1);
        const suggestion = suggestions[0];
        expect(suggestion.location).toBe('eastus');
        expect(suggestion.time).toBe('2024-01-15T11:30:00+00:00');
        expect(suggestion.rating).toBe(1);
        expect(suggestion.duration).toBe('04:00:00');
    });

    /**
    * Scenario 2: Find best time for interval 14/01/2022 - 16/01/2022 in eastus (no sampling)
    * Expected: Suggest the time of 15/01/2024 23:30 with score 4
    * Note: Contains single surrounding data point (+- one day) with negative value (boundary testing)
    */
    it('CarbonAdvisorModel.Scenario2', async () => {
        initMock(scenario2);
        const config: ConfigParams = {
            "allowed-locations": ["eastus"],
            "allowed-timeframes": ["2022-01-14T00:00:00Z - 2022-01-16T00:00:00Z"],
        };
        const inputs: PluginParams[] = [{
            "timestamp": "",
            "duration": 1
        }];
        const model = CarbonAwareAdvisor(config);
        mockAverage(model, 5);

        const result = await model.execute(inputs);
        const suggestions = validateSuggestions(result, config);

        expect(suggestions.length).toBe(1);
        const suggestion = suggestions[0];
        expect(suggestion.location).toBe("eastus");
        expect(suggestion.time).toBe("2022-01-15T23:30:00+00:00");
        expect(suggestion.rating).toBe(4);
    });

    /**
    * Scenario 3: Find best time for interval 01/01/2021 - 01/01/2022 in eastus (no sampling)
    * Expected: Suggest the time of 06/07/2021 11:30 with score 5
    * Note: Contains 2190 data points with 5 as the best score (others are <10, 100>)
    */
    it('CarbonAdvisorModel.Scenario3', async () => {
        initMock(scenario3);
        const config: ConfigParams = {
            "allowed-locations": ["eastus"],
            "allowed-timeframes": ["2021-01-01T00:00:00Z - 2022-01-01T00:00:00Z"],
        }
        const inputs: PluginParams[] = [{
            "timestamp": "",
            "duration": 1
        }];
        const model = CarbonAwareAdvisor(config);
        mockAverage(model, 50);

        const result = await model.execute(inputs);
        const suggestions = validateSuggestions(result, config);

        expect(suggestions.length).toBe(1);
        const suggestion = suggestions[0];
        expect(suggestion.location).toBe("eastus");
        expect(suggestion.time).toBe("2021-07-16T11:30:00+00:00");
        expect(suggestion.rating).toBe(5);
    });

    /**
     * Scenario 4: Find best time for 15/01/2024 either in eastus or westus between 12:00 and 18:00 (no sampling)
     * Expected: Suggest the time of 10:00 with score 5
     */
    it('CarbonAdvisorModel.Scenario4', async () => {
        initMock(scenario4);
        const config: ConfigParams = {
            "allowed-locations": ["eastus", "westus"],
            "allowed-timeframes": ["2024-01-15T00:00:00Z - 2024-01-16T00:00:00Z"],
        };
        const inputs: PluginParams[] = [{
            "timestamp": "",
            "duration": 1
        }];
        const model = CarbonAwareAdvisor(config);
        mockAverage(model, 5);

        const result = await model.execute(inputs);
        const suggestions = validateSuggestions(result, config);

        expect(suggestions.length).toBe(1);
        const suggestion = suggestions[0];
        expect(suggestion.location).toBe("westus");
        expect(suggestion.time).toBe("2024-01-15T10:00:00+00:00");
        expect(suggestion.rating).toBe(5);
    });

    /**
     * Scenario 5: Find best time between 15/01/2024 - 22/01/2024 in in [eastus, westus, centralus]
     * Expected: Suggest the time of 6:00 with score 1 in centralus
     */
    it('CarbonAdvisorModel.Scenario5', async () => {
        initMock(scenario5);
        const config: ConfigParams = {
            "allowed-locations": ["eastus", "westus", "centralus"],
            "allowed-timeframes": ["2024-01-15T00:00:00Z - 2024-01-22T00:00:00Z"],
        };
        const inputs: PluginParams[] = [{
            "timestamp": "",
            "duration": 1
        }];
        const model = CarbonAwareAdvisor(config);
        mockAverage(model, 5);

        const result = await model.execute(inputs);
        const suggestions = validateSuggestions(result, config);

        expect(suggestions.length).toBe(1);
        const suggestion = suggestions[0];
        expect(suggestion.location).toBe("centralus");
        expect(suggestion.time).toBe("2024-01-19T06:00:00+00:00");
        expect(suggestion.rating).toBe(1);
    });

    /** 
     * Scenario 6: Find best time for 15/01/2024 in usazure (us_azure test)
     * Expected: Suggest the time of 14:00 with score 19
     */
    it('CarbonAdvisorModel.Scenario6', async () => {
        initMock(scenario6);
        const config: ConfigParams = {
            "allowed-locations": ["us_azure"],
            "allowed-timeframes": ["2024-01-15T12:00:00Z - 2024-01-15T18:00:00Z"]
        };
        const inputs: PluginParams[] = [{
            "timestamp": "",
            "duration": 1
        }];
        const model = CarbonAwareAdvisor(config);
        mockAverage(model, 5);

        const result = await model.execute(inputs);
        const suggestions = validateSuggestions(result, config);

        expect(suggestions.length).toBe(1);
        const suggestion = suggestions[0];
        expect(suggestion.location).toBe("westus");
        expect(suggestion.time).toBe("2024-01-15T14:00:00+00:00");
        expect(suggestion.rating).toBe(15);
    });

    /** 
    * Scenario 7: Find best time for 15/01/2024 in world_azure locations (big dataset)
    * Expected: Suggest the time of 14:00 with score 19
    */
    it('CarbonAdvisorModel.Scenario7', async () => {
        initMock(scenario7);
        const config: ConfigParams = {
            "allowed-locations": ["world_azure"],
            "allowed-timeframes": ["2024-01-15T12:00:00Z - 2024-01-15T18:00:00Z"]
        };
        const inputs: PluginParams[] = [{
            "timestamp": "",
            "duration": 1
        }];
        const model = CarbonAwareAdvisor(config);
        mockAverage(model, 5);

        const result = await model.execute(inputs);
        const suggestions = validateSuggestions(result, config);

        expect(suggestions.length).toBe(1);
        const suggestion = suggestions[0];
        expect(suggestion.location).toBe("westindia");
        expect(suggestion.time).toBe("2024-01-15T14:00:00+00:00");
        expect(suggestion.rating).toBe(1);
    });
});

describe('CarbonAdvisorModel.Sampling', () => {
    /**
     * Validate README assumption:
     * A sampling number of samples for trade-off visualization. 
     * A best combination from each timeframe is always included.
     * So sampling **must be >= number of time regions in the allowed-timeframes***. 
     */
    it('CarbonAdvisorModel.Sampling.Scenario0', async () => {
        initMock(scenario1);
        const config: ConfigParams = {
            "allowed-locations": ["eastus"],
            "allowed-timeframes": [
                "2024-01-15T00:00:00Z - 2024-01-16T00:00:00Z",
                "2024-01-16T00:00:00Z - 2024-01-17T00:00:00Z",
                "2024-01-17T00:00:00Z - 2024-01-18T00:00:00Z"
            ],
            "sampling": 2
        };
        const inputs: PluginParams[] = [{
            "timestamp": "",
            "duration": 1
        }];
        const model = CarbonAwareAdvisor(config);
        await expect(model.execute(inputs))
            .rejects.toThrow("Sampling must be greater than or equal to the number of allowed timeframes.");
    });

    it('CarbonAdvisorModel.Sampling.Scenario1', async () => {
        initMock(scenario1);
        const config: ConfigParams = {
            "allowed-locations": ["eastus"],
            "allowed-timeframes": ["2024-01-15T12:00:00Z - 2024-01-15T18:00:00Z"],
            "sampling": 1
        };
        const inputs: PluginParams[] = [{
            "timestamp": "",
            "duration": 1
        }];
        const model = CarbonAwareAdvisor(config);
        mockAverage(model, 5);
        const result = await model.execute(inputs);
        validateSampling(result, config);
    });

    it('CarbonAdvisorModel.Sampling.Scenario2', async () => {
        initMock(scenario8);
        const config: ConfigParams = {
            "allowed-locations": ["eastus"],
            "allowed-timeframes": ["2024-01-14T00:00:00Z - 2024-01-17T00:00:00Z"],
            "sampling": 3
        };
        const inputs: PluginParams[] = [{
            "timestamp": "",
            "duration": 1
        }];
        const model = CarbonAwareAdvisor(config);
        mockAverage(model, 5);
        const result = await model.execute(inputs);
        validateSampling(result, config);
        console.log(JSON.stringify(result, null, 2));
    });

    it('CarbonAdvisorModel.Sampling.Scenario3', async () => {
        initMock(scenario9);
        const config: ConfigParams = {
            "allowed-locations": ["eastus", "westus", "centralus"],
            "allowed-timeframes": ["2024-01-01T00:00:00Z - 2024-01-22T00:00:00Z"],
            "sampling": 10
        };
        const inputs: PluginParams[] = [{
            "timestamp": "",
            "duration": 1
        }];
        const model = CarbonAwareAdvisor(config);
        const result = await model.execute(inputs);
        const suggestions = result[0].suggestions as Suggestion[];

        // Check if all suggestions have the same score
        expect(suggestions.length).toBe(4);
        for (const suggestion of suggestions) {
            // Location in allowed-locations
            expect(config["allowed-locations"].includes(suggestion.location)).toBe(true);
            expect(suggestion.rating).toBe(1);
        }

        validateSampling(result, config);
    });

    it('CarbonAdvisorModel.Sampling.Scenario4', async () => {
        const data = scenario8;
        data.sort((a, b) => a.rating - b.rating);

        initMock(data);
        const config: ConfigParams = {
            "allowed-locations": ["eastus"],
            "allowed-timeframes": ["2024-01-14T00:00:00Z - 2024-01-17T00:00:00Z"],
            "sampling": 5
        };
        const inputs: PluginParams[] = [{
            "timestamp": "",
            "duration": 1
        }];
        const model = CarbonAwareAdvisor(config);
        const result = await model.execute(inputs);
        validateSampling(result, config);

        // Sort plotted points
        const plotted_points = (result[0].plotted_points as Suggestion[]).sort((a, b) => a.rating - b.rating);

        const fst = plotted_points[0];
        expect(fst.location).toBe("eastus");
        expect(fst.time).toBe("2024-01-15T02:00:00+00:00");
        expect(fst.rating).toBe(5);

        let lastRating = plotted_points[0].rating;
        for (let i = 1; i < 5; i++) {
            expect(plotted_points[i].rating).toBeGreaterThan(lastRating);
            expect(config["allowed-locations"].includes(plotted_points[i].location)).toBe(true);
        }
    });

    /**
     * Validate the following:
     * If you have 2 timeframes and 5 samples then the samples will be:
     * The best for timeframe one
     * The best for timefraume 2
     * 2 at random from the largest timeframe
     * 1 at random from the smallest timeframe
     */
    it('CarbonAdvisorModel.Sampling.Scenario5', async () => {
        initMock(scenario10);
        initMockWithParams(scenario10, "eastus", "2023-01-01T00:00:00Z", "2023-01-02T00:00:00Z");
        initMockWithParams(scenario10, "eastus", "2023-01-03T04:00:00Z", "2023-01-03T20:00:00Z");

        const config: ConfigParams = {
            "allowed-locations": ["eastus"],
            "allowed-timeframes": [
                "2023-01-01T00:00:00Z - 2023-01-02T00:00:00Z",
                "2023-01-03T04:00:00Z - 2023-01-03T20:00:00Z"
            ],
            "sampling": 5
        };
        const inputs: PluginParams[] = [{
            "timestamp": "",
            "duration": 1
        }];
        const model = CarbonAwareAdvisor(config);
        const result = await model.execute(inputs);
        validateSampling(result, config);
        const plotted_points = (result[0].plotted_points as Suggestion[]).sort((a, b) => a.rating - b.rating);
        const sortedInput = scenario10.sort((a, b) => a.rating - b.rating);

        console.log("Plotted", JSON.stringify(plotted_points, null, 2));
        console.log("Sorted", JSON.stringify(sortedInput, null, 2));

        // The best for timeframe one
        const fst = plotted_points[0];
        expect(fst.location).toBe("eastus");
        expect(fst.time).toBe("2023-01-03T02:00:00+00:00");
        expect(fst.rating).toBe(4);

        // The best for timeframe two
        const snd = plotted_points[1];
        expect(snd.location).toBe("eastus");
        expect(snd.time).toBe("2023-01-03T02:00:00+00:00");
        expect(snd.rating).toBe(4);

        const lastRating = plotted_points[1].rating;
        expect(plotted_points[2].time.startsWith("2023-01")).toBe(true);
        expect(plotted_points[2].rating).toBeGreaterThanOrEqual(lastRating);

        expect(plotted_points[3].time.startsWith("2023-01")).toBe(true);
        expect(plotted_points[3].rating).toBeGreaterThanOrEqual(lastRating);

        expect(plotted_points[4].time.startsWith("2023-01")).toBe(true);
        expect(plotted_points[4].rating).toBeGreaterThanOrEqual(lastRating);
    });
});

function validateSampling(result: PluginParams[], config: ConfigParams) {
    console.log("Validating sampling:");
    const suggestions = result[0].suggestions as Suggestion[];
    const plotted_points = result[0].plotted_points as Suggestion[];

    // Check if the number of plotted points is equal to the sampling config
    expect(plotted_points.length).toBe(config["sampling"]);

    // Check if all plottings are within the allowed locations and timeframes
    checkIfSuggestedLocationsWithinAllowedLocations(config, plotted_points);
    checkIfSuggestedTimeframesWithinRange(config, plotted_points);
    return suggestions;
}

function validateSuggestions(result: PluginParams[], config: ConfigParams): Suggestion[] {
    console.log("Validating suggestions:");
    console.log(JSON.stringify(result, null, 2));

    expect(result.length).toBe(1);
    expect(result[0].suggestions.length).toBeGreaterThanOrEqual(1);
    const suggestions = result[0].suggestions as Suggestion[];
    checkIfSuggestedTimeframesWithinRange(config, suggestions);
    checkIfSuggestedLocationsWithinAllowedLocations(config, suggestions);
    return suggestions;
}

function checkIfSuggestedLocationsWithinAllowedLocations(config: ConfigParams, suggestions: Suggestion[]) {
    const allowedLocations = config["allowed-locations"] as string[];
    const map = locations as Record<string, string[]>;
    for (const loc of allowedLocations) {
        if (loc in locations) {
            allowedLocations.push(...map[loc]);
        }
    }

    for (const suggestion of suggestions) {
        // Must be one of the allowed locations
        expect(allowedLocations.includes(suggestion.location),
            `Suggested location ${suggestion.location} is not within the allowed locations ${allowedLocations}`)
            .toBe(true);
    }
}

function checkIfSuggestedTimeframesWithinRange(config: ConfigParams, suggestions: Suggestion[]) {
    const allowedTimeframes = config["allowed-timeframes"] as string[];
    for (const suggestion of suggestions) {
        let isValid = false;
        for (const timeframe of allowedTimeframes) {
            // Extract allowed timeframe
            const from = new Date(timeframe.split(" - ")[0]);
            const to = new Date(timeframe.split(" - ")[1]);

            // Extract suggested timeframe
            const date = new Date(suggestion.time);

            // Extract duration
            const dateWithDuration = addDuration(date, suggestion.duration);

            expect(date, `Suggested timeframe must be a valid date`).not.toBe("Invalid Date");
            expect(dateWithDuration, `Suggested duration must be a valid date`).not.toBe("Invalid Date");

            const isWithinBounds = (date >= from && date <= to) || (dateWithDuration >= from && dateWithDuration <= to);
            // console.log(`Checking if ${date} (or ${dateWithDuration}) is between ${from} and ${to}`)
            isValid = isValid || isWithinBounds;
        }
        // Must be within the allowed timeframes
        expect(isValid, `Suggested timeframe ${suggestion.time} is not within the allowed timeframes ${allowedTimeframes}`)
            .toBe(true);
    }
}

function addDuration(date: Date, duration: string): Date {
    const newDate = new Date(date);
    const parts = duration.split(":");
    newDate.setHours(newDate.getHours() + parseInt(parts[0]));
    newDate.setMinutes(newDate.getMinutes() + parseInt(parts[1]));
    newDate.setSeconds(newDate.getSeconds() + parseInt(parts[2]));
    return newDate;
}
