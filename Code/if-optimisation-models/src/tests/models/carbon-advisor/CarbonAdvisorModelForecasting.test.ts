import { CarbonAwareAdvisor } from "../../../lib/carbon-aware-advisor"; // This is a temp fix, will be removed once the new model is ready
import { ConfigParams, PluginParams } from "../../../types/common";
import locations = require("../../../lib/carbon-aware-advisor/locations.json");
import 'jest-expect-message';

describe('CarbonAdvisorModel.Forecasting', () => {
    /**
     * Input 1/1/2023 - 1/1/2025 (all dates in 2024 are set to 1 for easy testing)
     * Allowed locations: eastus
     * Allowed timeframes: 2024-05-01T00:00:00Z - 2024-05-10T00:00:00Z
     * Expect single suggestion of 4 hours at eastus on 2024-05-04T20:00:00Z, with rating 5.5
     */
    it('CarbonAdvisorModel.Forecasting.Scenario1', async () => {
        const config: ConfigParams = {
            "allowed-locations": ["eastus"],
            "allowed-timeframes": ["2024-05-01T00:00:00Z - 2024-05-10T00:00:00Z"]
        };
        const inputs: PluginParams[] = [{
            "timestamp": "",
            "duration": 1
        }];
        const model = CarbonAwareAdvisor(config);
        const result = await model.execute(inputs);
        const suggestions = validateSuggestions(result, config, 1);
        const first = suggestions[0];
        expect(first.rating).toBe(5.5);
        expect(first.duration).toBe("04:00:00");
        expect(first.location).toBe("eastus");
        expect(first.time.startsWith("2024-05-04T20:00")).toBe(true);
    });
});

function validateSuggestions(result: PluginParams[], config: ConfigParams, size: number): Suggestion[] {
    console.log("Validating suggestions:");
    console.log(JSON.stringify(result, null, 2));

    expect(result.length).toBe(1);
    expect(result[0].suggestions.length).toBe(size);
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
