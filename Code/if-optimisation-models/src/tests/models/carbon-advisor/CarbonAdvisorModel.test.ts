import { CarbonAwareAdvisor } from "../../../lib/carbon-aware-advisor"; // This is a temp fix, will be removed once the new model is ready
import { ConfigParams, PluginParams } from "../../../types/common";
import { PluginInterface } from "../../../interfaces";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
const mock = new MockAdapter(axios);

// Import scenario1.json
import scenario1 = require("./scenarios/scenario1.json");
import scenario2 = require("./scenarios/scenario2.json");
import scenario3 = require("./scenarios/scenario3.json");

function initMock(scenario: any) {
    mock.onGet(new RegExp('/emissions/bylocations')).reply(200, scenario);
}

function mockAverage(model: PluginInterface, value: number) {
    jest.spyOn(model, 'getAverageScoreForLastXDays').mockResolvedValue(value);
}

describe('CarbonAdvisorModel', () => {
    /**
     * Scenario 1: Find best time for 15/01/2024 in eastus between 12:00 and 18:00 (no sampling)
     * Expected: Suggest the time of 11:30 with score 1
     * Note: Contains single surrounding data point (+- one day) with negative value (boundary testing)
     */
    it('CarbonAdvisorModel.Scenario1', async () => {
        initMock(scenario1);
        const config: ConfigParams = {};
        const inputs: PluginParams[] = [
            {
                "timestamp": "",
                "duration": 1,
                "allowed-locations": ["eastus"],
                "allowed-timeframes": ["2024-01-15T12:00:00Z - 2024-01-15T18:00:00Z"],
            }
        ];
        const model = CarbonAwareAdvisor(config);
        mockAverage(model, 5);

        const result = await model.execute(inputs);
        const suggestions = validateSuggestions(result);

        expect(suggestions.length).toBe(1);
        const suggestion = suggestions[0];
        expect(suggestion.suggestedLocation).toBe("eastus");
        expect(suggestion.suggestedTimeframe).toBe("2024-01-15T11:30:00+00:00");
        expect(suggestion.suggestedScore).toBe(1);
    });

    /**
    * Scenario 2: Find best time for interval 14/01/2022 - 16/01/2022 in eastus (no sampling)
    * Expected: Suggest the time of 15/01/2024 23:30 with score 4
    * Note: Contains single surrounding data point (+- one day) with negative value (boundary testing)
    */
    it('CarbonAdvisorModel.Scenario2', async () => {
        initMock(scenario2);
        const config: ConfigParams = {};
        const inputs: PluginParams[] = [
            {
                "timestamp": "",
                "duration": 1,
                "allowed-locations": ["eastus"],
                "allowed-timeframes": ["2022-01-14T00:00:00Z - 2022-01-16T00:00:00Z"],
            }
        ];
        const model = CarbonAwareAdvisor(config);
        mockAverage(model, 5);

        const result = await model.execute(inputs);
        const suggestions = validateSuggestions(result);

        expect(suggestions.length).toBe(1);
        const suggestion = suggestions[0];
        expect(suggestion.suggestedLocation).toBe("eastus");
        expect(suggestion.suggestedTimeframe).toBe("2022-01-15T23:30:00+00:00");
        expect(suggestion.suggestedScore).toBe(4);
    });

    /**
    * Scenario 3: Find best time for interval 01/01/2021 - 01/01/2022 in eastus (no sampling)
    * Expected: Suggest the time of 06/07/2021 11:30 with score 5
    * Note: Contains 2190 data points with 5 as the best score (others are <10, 100>)
    */
    it('CarbonAdvisorModel.Scenario3', async () => {
        initMock(scenario3);
        const config: ConfigParams = {};
        const inputs: PluginParams[] = [
            {
                "timestamp": "",
                "duration": 1,
                "allowed-locations": ["eastus"],
                "allowed-timeframes": ["2021-01-01T00:00:00Z - 2022-01-01T00:00:00Z"],
            }
        ];
        const model = CarbonAwareAdvisor(config);
        mockAverage(model, 50);

        const result = await model.execute(inputs);
        const suggestions = validateSuggestions(result);

        expect(suggestions.length).toBe(1);
        const suggestion = suggestions[0];
        expect(suggestion.suggestedLocation).toBe("eastus");
        expect(suggestion.suggestedTimeframe).toBe("2021-07-16T11:30:00+00:00");
        expect(suggestion.suggestedScore).toBe(5);
    });
});

function validateSuggestions(result: PluginParams[]): Suggestion[] {
    console.log("Validating suggestions:");
    console.log(JSON.stringify(result, null, 2));

    expect(result.length).toBe(1);
    expect(result[0].suggestions.length).toBeGreaterThanOrEqual(1);
    const suggestions = (result[0].suggestions as any[]).map((suggestion: any) => ({
        suggestedLocation: suggestion['suggested-location'],
        suggestedTimeframe: suggestion['suggested-timeframe'],
        suggestedScore: suggestion['suggested-score']
    }));

    checkIfSuggestedTimeframesWithinRange(result, suggestions);
    checkIfSuggestedLocationsWithinAllowedLocations(result, suggestions);
    return suggestions;
}

function checkIfSuggestedLocationsWithinAllowedLocations(inputs: PluginParams[],
    suggestions: Suggestion[]) {
    const allowedLocations = inputs[0]["allowed-locations"] as string[];
    for (const suggestion of suggestions) {
        expect(typeof suggestion.suggestedLocation).toBe("string");
        // Must be one of the allowed locations
        expect(allowedLocations.includes(suggestion.suggestedLocation)).toBe(true);
    }
}

function checkIfSuggestedTimeframesWithinRange(inputs: PluginParams[], suggestions: Suggestion[]) {
    const allowedTimeframes = inputs[0]["allowed-timeframes"] as string[];
    for (const suggestion of suggestions) {
        let isValid = false;
        for (const timeframe of allowedTimeframes) {
            const from = new Date(timeframe.split(" - ")[0]);
            const to = new Date(timeframe.split(" - ")[1]);
            const date = new Date(suggestion.suggestedTimeframe);
            console.log(date)
            console.log("Checking if ", date, " is between ", from, " and ", to)
            isValid = isValid || (date >= from && date <= to);
        }
        // Must be within the allowed timeframes
        expect(isValid).toBe(true);
    }
}

// npm run test -- src/tests/models/CarbonAdvisorModel.test.ts

// describe('CarbonAdvisorModel.Configuration', () => {
//     // it('CarbonAdvisorModel.Configuration.MissingParams', async () => {
//     //     const config : ConfigParams = {};
//     //     const inputs : PluginParams[] = [];
//     //     const model = CarbonAwareAdvisor(config);
//     //     await expect(model.execute(inputs))
//     //         .rejects.toThrow("Required Parameter allowed-locations not provided");
//     // });

//     it('CarbonAdvisorModel.Configuration.MissingParams', async () => {
//         const config : ConfigParams = {
//             "allowed-locations": []
//         };
//         const inputs : PluginParams[] = [];
//         const model = CarbonAwareAdvisor(config);
//         await expect(model.execute(inputs, config))
//             .rejects.toThrow("Required Parameter allowed-locations is empty");
//     });
// });