import { CarbonAwareAdvisor } from "../../../lib/carbon-aware-advisor"; // This is a temp fix, will be removed once the new model is ready
import { ConfigParams, PluginParams } from "../../../types/common";
import locations = require("../../../lib/carbon-aware-advisor/locations.json");
import 'jest-expect-message';
import { config } from "dotenv";

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

    /**
     * Input 1/1/2018 - 1/1/2025 (all dates in 2024 are set to 1 for easy testing)
     * Allowed locations: eastus
     * Allowed timeframes: 2024-05-01T00:00:00Z - 2024-05-10T00:00:00Z
     * Expect three suggestions of 4 hours at eastus on 2024-05-04T20:00:00Z, 2025-05-04T20:00:00Z, 2026-05-04T20:00:00Z, with rating 5.5
     */
    it('CarbonAdvisorModel.Forecasting.Scenario2', async () => {
        const config: ConfigParams = {
            "allowed-locations": ["eastus"],
            "allowed-timeframes": [
                "2024-05-01T00:00:00Z - 2024-05-10T00:00:00Z",
                "2025-05-01T00:00:00Z - 2025-05-10T00:00:00Z",
                "2026-05-01T00:00:00Z - 2026-05-10T00:00:00Z",
            ]
        };
        const inputs: PluginParams[] = [{
            "timestamp": "",
            "duration": 1
        }];
        const model = CarbonAwareAdvisor(config);
        const result = await model.execute(inputs);
        const suggestions = validateSuggestions(result, config, 3);
        for(const suggestion of suggestions) {
            expect(suggestion.rating).toBe(5.5);
            expect(suggestion.duration).toBe("04:00:00");
            expect(suggestion.location).toBe("eastus");
            expect(suggestion.time.endsWith("-05-04T00:00:00.000Z")).toBe(true);
        }
    });

    /**
     * INPUT: scenario3.json
     * Input 1/1/2018 - 1/1/2025
     * Allowed locations: eastus, westus, centralus
     * Allowed timeframes: 2025-05-01T00:00:00Z - 2025-05-10T00:00:00Z, 2025-03-01T00:00:00Z - 2025-03-10T00:00:00Z, 2025-09-01T00:00:00Z - 2025-09-10T00:00:00Z
     * Expect 
     */
    it('CarbonAdvisorModel.Forecasting.Scenario3', async () => {
        const config: ConfigParams = {
            "allowed-locations": ["eastus", "westus", "centralus"],
            "allowed-timeframes": [
                "2025-05-01T00:00:00Z - 2025-05-10T00:00:00Z",
                "2025-03-01T00:00:00Z - 2025-03-10T00:00:00Z",
                "2025-09-01T00:00:00Z - 2025-09-10T00:00:00Z",
            ]
        };
        const inputs: PluginParams[] = [{
            "timestamp": "",
            "duration": 1
        }];
        const model = CarbonAwareAdvisor(config);
        const result = await model.execute(inputs);
        const suggestions = validateSuggestions(result, config, 3);
        for (const suggestion of suggestions) {
            expect(suggestion.rating).toBeCloseTo(19.688, 2);
            expect(suggestion.duration).toBe("04:00:00");
            expect([`eastus`, `westus`, `centralus`].includes(suggestion.location)).toBe(true);
            expect(suggestion.time.startsWith("2025-0")).toBe(true);
        }
    });

    /**
     * INPUT: scenario3.json
     * Same input as scenario 3, this time we will check if the model can handle a prediction for 4, 5 and 6 years ahead
     */
    it('CarbonAdvisorModel.Forecasting.Scenario4', async () => {
        const timeframe = `{year}-01-01T00:00:00Z - {year}-01-10T00:00:00Z`
        const inputs: PluginParams[] = [{
            "timestamp": "",
            "duration": 1
        }];
        const config: ConfigParams = {
            "allowed-locations": ["eastus"],
            "allowed-timeframes": [timeframe.replace(/\{year\}/g, "2028")]
        };
        let model = CarbonAwareAdvisor(config);

        // Validate 2028 (should succeed, it's within next 5 years)
        let result = await model.execute(inputs);
        let suggestions = validateSuggestions(result, config, 1);
        expect(suggestions.length).toBe(1);
        expect(suggestions[0].location).toBe("eastus");
        expect(suggestions[0].time.startsWith("2028-01-")).toBe(true);
        expect(suggestions[0].rating).toBeCloseTo(20.1475, 2);
        expect(suggestions[0].duration).toBe("04:00:00");

        // Validate 2029 (should still succeed, it's within next 5 years 01/01/2029 is within 5 years from today)
        config["allowed-timeframes"] = [timeframe.replace(/\{year\}/g, "2029")];
        model = CarbonAwareAdvisor(config);
        result = await model.execute(inputs);
        suggestions = validateSuggestions(result, config, 1);
        expect(suggestions.length).toBe(1);
        expect(suggestions[0].location).toBe("eastus");
        expect(suggestions[0].time.startsWith("2029-01-")).toBe(true);
        expect(suggestions[0].rating).toBeCloseTo(20.1475, 2);
        expect(suggestions[0].duration).toBe("04:00:00");

        // Validate 2030 (should fail, it's more than 5 years ahead)
        config["allowed-timeframes"] = [timeframe.replace(/\{year\}/g, "2030")];
        model = CarbonAwareAdvisor(config);
        result = await model.execute(inputs);
        expect(result.length).toBe(1);
        expect(result[0].suggestions.length).toBe(0);
    });

    /**
     * INPUT: scenario3.json
     * Test sampling of allowed timeframes
     */
    it('CarbonAdvisorModel.Forecasting.Scenario5', async () => {
        const config: ConfigParams = {
            "allowed-locations": ["eastus", "westus", "centralus"],
            "allowed-timeframes": [
                "2025-01-01T00:00:00Z - 2025-01-10T00:00:00Z",
                "2025-05-01T00:00:00Z - 2025-05-10T00:00:00Z",
            ],
            "sampling": 2
        };
        const inputs: PluginParams[] = [{
            "timestamp": "",
            "duration": 1
        }];
        const model = CarbonAwareAdvisor(config);
        const result = await model.execute(inputs);
        const suggestions = validateSuggestions(result, config, 2);
        for (const suggestion of suggestions) {
            expect(suggestion.rating).toBeCloseTo(20.1475, 2);
            expect([`eastus`, `westus`, `centralus`].includes(suggestion.location)).toBe(true);
            expect(suggestion.time.startsWith("2025-0")).toBe(true);
            expect(suggestion.duration).toBe("04:00:00");
        }

        expect(result[0].plotted_points.length).toBe(2);
        const plotted_points = result[0].plotted_points;
        for (const point of plotted_points) {
            expect(suggestions.includes(point)).toBe(true);
        }
    });

    /**
     * INPUT: scenario3.json
     * Test sampling of allowed timeframes
     */
    it('CarbonAdvisorModel.Forecasting.Scenario6', async () => {
        const config: ConfigParams = {
            "allowed-locations": ["eastus", "westus", "centralus"],
            "allowed-timeframes": [
                "2025-01-01T00:00:00Z - 2025-01-10T00:00:00Z",
                "2026-03-01T00:00:00Z - 2026-03-10T00:00:00Z",
                "2027-06-01T00:00:00Z - 2027-06-10T00:00:00Z",
                "2028-09-01T00:00:00Z - 2028-09-10T00:00:00Z",
            ],
            "sampling": 10
        };
        const inputs: PluginParams[] = [{
            "timestamp": "",
            "duration": 1
        }];
        const model = CarbonAwareAdvisor(config);
        const result = await model.execute(inputs);
        const suggestions = validateSuggestions(result, config, 3);
        for (const suggestion of suggestions) {
            expect(suggestion.rating).toBeCloseTo(19.688, 2);
            expect([`eastus`, `westus`, `centralus`].includes(suggestion.location)).toBe(true);
            expect(suggestion.time.startsWith("2025")
                || suggestion.time.startsWith("2026")
                || suggestion.time.startsWith("2027")
                || suggestion.time.startsWith("2028")).toBe(true);
            expect(suggestion.duration).toBe("04:00:00");
        }

        expect(result[0].plotted_points.length).toBe(10);
        const plotted_points = result[0].plotted_points;
        for (const point of plotted_points) {
            expect([`eastus`, `westus`, `centralus`].includes(point.location)).toBe(true);
            expect(point.time.startsWith("2025")
                || point.time.startsWith("2026")
                || point.time.startsWith("2027")
                || point.time.startsWith("2028")).toBe(true);
            expect(point.duration).toBe("04:00:00");
            expect(point.rating).toBeGreaterThanOrEqual(19.67);
        }
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
