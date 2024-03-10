import { CarbonAwareAdvisor } from "../../../lib/carbon-aware-advisor"; // This is a temp fix, will be removed once the new model is ready
import { ConfigParams, PluginParams } from "../../../types/common";
import { PluginInterface } from "../../../interfaces";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import 'jest-expect-message';
const mock = new MockAdapter(axios);


import scenario1 = require("./scenarios/scenario1.json");

function initMock(scenario: any) {
    mock.onGet(new RegExp('/emissions/bylocations')).reply(200, scenario);
}

function mockAverage(model: PluginInterface, value: number) {
    jest.spyOn(model, 'getAverageScoreForLastXDays').mockResolvedValue(value);
}

describe('CarbonAdvisorModel.Unit', () => {
    it('CarbonAdvisorModel.Unit.Metadata', async () => {
        const config: ConfigParams = {};
        const inputs: PluginParams[] = [];
        const model = CarbonAwareAdvisor(config);
        expect(model.metadata['kind']).toBe('execute');
    });

    it('CarbonAdvisorModel.Unit.UndefinedParams', async () => {
        const config: ConfigParams = {};
        const inputs: PluginParams[] = [];
        const model = CarbonAwareAdvisor(config);
        await expect(model.execute(inputs))
            .rejects.toThrow("Required Parameters not provided");
    });

    // Locations reading
    it('CarbonAdvisorModel.Unit.SetLocations', async () => {
        const config: ConfigParams = {
            "allowed-locations": ["africa_azure", "asia_aws", "world_aws", "world_azure"],
            "allowed-timeframes": ["2024-01-15T12:00:00Z - 2024-01-15T18:00:00Z"]
        };
        const inputs: PluginParams[] = [{
            "timestamp": "",
            "duration": 1
        }];
        const model = CarbonAwareAdvisor(config);
        mockAverage(model, 1);
        initMock(scenario1);
        await model.execute(inputs);

        const supportedLocations = model.supportedLocations as Set<string>;
        expect(supportedLocations.size).toBe(90);
        expect(supportedLocations).toContain("eastus");
        expect(supportedLocations).toContain("us_azure");
        expect(supportedLocations).toContain("europe_aws");
        expect(supportedLocations).toContain("ca-west-1");
    });

    // Locations Validation
    it('CarbonAdvisorModel.Unit.UndefinedLocations', async () => {
        const config: ConfigParams = {
            "A": "B"
        };
        const inputs: PluginParams[] = [];
        const model = CarbonAwareAdvisor(config);
        await expect(model.execute(inputs))
            .rejects.toThrow("Required Parameter allowed-locations not provided");
    });

    it('CarbonAdvisorModel.Unit.EmptyLocationsStr', async () => {
        const config: ConfigParams = {
            "allowed-locations": "A"
        };
        const inputs: PluginParams[] = [];
        const model = CarbonAwareAdvisor(config);
        await expect(model.execute(inputs))
            .rejects.toThrow("Required Parameter 'allowed-locations' is empty");
    });

    it('CarbonAdvisorModel.Unit.EmptyLocationsArr', async () => {
        const config: ConfigParams = {
            "allowed-locations": []
        };
        const inputs: PluginParams[] = [];
        const model = CarbonAwareAdvisor(config);
        await expect(model.execute(inputs))
            .rejects.toThrow("Required Parameter 'allowed-locations' is empty");
    });

    it('CarbonAdvisorModel.Unit.LocationsInvalid', async () => {
        const config: ConfigParams = {
            "allowed-locations": ["A"]
        };
        const inputs: PluginParams[] = [];
        const model = CarbonAwareAdvisor(config);
        await expect(model.execute(inputs))
            .rejects.toThrow("Location A is not supported");
    });

    it('CarbonAdvisorModel.Unit.LocationsValidInvalid', async () => {
        const config: ConfigParams = {
            "allowed-locations": ["eastus", "london"]
        };
        const inputs: PluginParams[] = [];
        const model = CarbonAwareAdvisor(config);
        await expect(model.execute(inputs))
            .rejects.toThrow("Location london is not supported");
    });

    it('CarbonAdvisorModel.Unit.LocationsRegions', async () => {
        const config: ConfigParams = {
            "allowed-locations": ["africa_azure", "asia_aws", "world_aws", "world_azure"],
            "allowed-timeframes": ["2024-01-15T12:00:00Z - 2024-01-15T18:00:00Z"]
        };
        const inputs: PluginParams[] = [{
            "timestamp": "",
            "duration": 1
        }];
        const model = CarbonAwareAdvisor(config);
        mockAverage(model, 1);
        initMock(scenario1);
        const result = await model.execute(inputs);
    });

    // Timeframes Validation
    it('CarbonAdvisorModel.Unit.TimeframeMissing', async () => {
        const config: ConfigParams = {
            "allowed-locations": ["world_aws"],
        };
        const inputs: PluginParams[] = [];
        const model = CarbonAwareAdvisor(config);
        mockAverage(model, 1);
        initMock(scenario1);
        await expect(model.execute(inputs))
            .rejects.toThrow("Required Parameter allowed-timeframes not provided");
    });

    it('CarbonAdvisorModel.Unit.TimeframeStr', async () => {
        const config: ConfigParams = {
            "allowed-locations": ["world_aws"],
            "allowed-timeframes": "str"
        };
        const inputs: PluginParams[] = [];
        const model = CarbonAwareAdvisor(config);
        mockAverage(model, 1);
        initMock(scenario1);
        await expect(model.execute(inputs))
            .rejects.toThrow("Required Parameter allowed-timeframes is empty");
    });

    it('CarbonAdvisorModel.Unit.TimeframeEmptyArr', async () => {
        const config: ConfigParams = {
            "allowed-locations": ["world_aws"],
            "allowed-timeframes": []
        };
        const inputs: PluginParams[] = [];
        const model = CarbonAwareAdvisor(config);
        mockAverage(model, 1);
        initMock(scenario1);
        await expect(model.execute(inputs))
            .rejects.toThrow("Required Parameter allowed-timeframes is empty");
    });

    it('CarbonAdvisorModel.Unit.TimeframeInvalid1', async () => {
        const config: ConfigParams = {
            "allowed-locations": ["world_aws"],
            "allowed-timeframes": ["str"]
        };
        const inputs: PluginParams[] = [];
        const model = CarbonAwareAdvisor(config);
        mockAverage(model, 1);
        initMock(scenario1);
        await expect(model.execute(inputs))
            .rejects.toThrow("Timeframe str is invalid");
    });

    it('CarbonAdvisorModel.Unit.TimeframeInvalid2', async () => {
        const config: ConfigParams = {
            "allowed-locations": ["world_aws"],
            "allowed-timeframes": ["str - str"]
        };
        const inputs: PluginParams[] = [];
        const model = CarbonAwareAdvisor(config);
        mockAverage(model, 1);
        initMock(scenario1);
        await expect(model.execute(inputs))
            .rejects.toThrow("Timeframe str - str is invalid");
    });
    
    it('CarbonAdvisorModel.Unit.TimeframeValid', async () => {
        const config: ConfigParams = {
            "allowed-locations": ["world_aws"],
            "allowed-timeframes": ["2024-01-15T12:00:00Z - 2024-01-15T18:00:00Z"]
        };
        const inputs: PluginParams[] = [{
            "timestamp": "",
            "duration": 1
        }];
        const model = CarbonAwareAdvisor(config);
        mockAverage(model, 1);
        initMock(scenario1);
        await model.execute(inputs);
    });

    it('CarbonAdvisorModel.Unit.TimeframeStartDateLater', async () => {
        const from = "2024-01-15T18:00:01Z";
        const to = "2024-01-15T18:00:00Z";

        const config: ConfigParams = {
            "allowed-locations": ["world_aws"],
            "allowed-timeframes": [`${from} - ${to}`]
        };
        const inputs: PluginParams[] = [];
        const model = CarbonAwareAdvisor(config);
        mockAverage(model, 1);
        initMock(scenario1);
        await expect(model.execute(inputs))
            .rejects.toThrow(`Start time ${from} must be before end time ${to}`);
    });

    it('CarbonAdvisorModel.Unit.TimeframeStartDateLater1', async () => {
        const from = "2024-01-16T18:00:00Z";
        const to = "2024-01-15T18:00:00Z";

        const config: ConfigParams = {
            "allowed-locations": ["world_aws"],
            "allowed-timeframes": [`${from} - ${to}`]
        };
        const inputs: PluginParams[] = [];
        const model = CarbonAwareAdvisor(config);
        mockAverage(model, 1);
        initMock(scenario1);
        await expect(model.execute(inputs))
            .rejects.toThrow(`Start time ${from} must be before end time ${to}`);
    });

    it('CarbonAdvisorModel.Unit.TimeframeValid', async () => {
        const from = "2024-01-15T12:00:00Z";
        const to = "2024-01-15T18:00:00Z";

        const config: ConfigParams = {
            "allowed-locations": ["world_aws"],
            "allowed-timeframes": [`${from} - ${to}`]
        };
        const inputs: PluginParams[] = [{
            "timestamp": "",
            "duration": 1
        }];
        const model = CarbonAwareAdvisor(config);
        mockAverage(model, 1);
        initMock(scenario1);
        await model.execute(inputs);
    });

    // Sampling Validation
    it('CarbonAdvisorModel.Unit.SamplingMissing', async () => {
        const config: ConfigParams = {
            "allowed-locations": ["world_aws"],
            'allowed-timeframes': ['2024-01-15T12:00:00Z - 2024-01-15T18:00:00Z']
        };
        const inputs: PluginParams[] = [{
            "timestamp": "",
            "duration": 1
        }];
        const model = CarbonAwareAdvisor(config);
        mockAverage(model, 1);
        initMock(scenario1);

        const spy = jest.spyOn(console, 'log');
        await model.execute(inputs);
        expect(spy).toHaveBeenCalledWith('Sampling not provided, ignoring');
    });

    it('CarbonAdvisorModel.Unit.SamplingInvalidStr', async () => {
        const config: ConfigParams = {
            "allowed-locations": ["world_aws"],
            'allowed-timeframes': ['2024-01-15T12:00:00Z - 2024-01-15T18:00:00Z'],
            "sampling": "some string"
        };
        const inputs: PluginParams[] = [{
            "timestamp": "",
            "duration": 1
        }];
        const model = CarbonAwareAdvisor(config);
        mockAverage(model, 1);
        initMock(scenario1);

        await expect(model.execute(inputs))
            .rejects.toThrow("Sampling must be an integer.");
    });

    it('CarbonAdvisorModel.Unit.SamplingInvalidZero', async () => {
        const config: ConfigParams = {
            "allowed-locations": ["world_aws"],
            'allowed-timeframes': ['2024-01-15T12:00:00Z - 2024-01-15T18:00:00Z'],
            "sampling": 0
        };
        const inputs: PluginParams[] = [{
            "timestamp": "",
            "duration": 1
        }];
        const model = CarbonAwareAdvisor(config);
        mockAverage(model, 1);
        initMock(scenario1);
        await expect(model.execute(inputs))
        .rejects.toThrow("Sampling must be a positive number.");
    });

    it('CarbonAdvisorModel.Unit.SamplingValid', async () => {
        const config: ConfigParams = {
            "allowed-locations": ["world_aws"],
            'allowed-timeframes': ['2024-01-15T12:00:00Z - 2024-01-15T18:00:00Z'],
            "sampling": 1
        };
        const inputs: PluginParams[] = [{
            "timestamp": "",
            "duration": 1
        }];
        const model = CarbonAwareAdvisor(config);
        mockAverage(model, 1);
        initMock(scenario1);
        await model.execute(inputs);
    });
});