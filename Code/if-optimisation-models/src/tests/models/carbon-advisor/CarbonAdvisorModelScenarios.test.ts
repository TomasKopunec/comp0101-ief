import { CarbonAwareAdvisor } from "../../../lib/carbon-aware-advisor"; // This is a temp fix, will be removed once the new model is ready
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

import locations = require("../../../lib/carbon-aware-advisor/locations.json");

function initMock(scenario: any) {
    mock.onGet(new RegExp('/emissions/bylocations')).reply(200, scenario);
}

function mockAverage(model: PluginInterface, value: number) {
    jest.spyOn(model, 'getAverageScoreForLastXDays').mockResolvedValue(value);
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
    for(const loc of allowedLocations) {
        if(loc in locations) {
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
            console.log(`Checking if ${date} (or ${dateWithDuration}) is between ${from} and ${to}`)
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
