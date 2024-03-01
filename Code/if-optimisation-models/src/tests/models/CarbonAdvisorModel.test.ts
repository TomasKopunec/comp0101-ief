import { CarbonAwareAdvisor } from "../../lib/carbon-aware-advisor"; // This is a temp fix, will be removed once the new model is ready
import { ConfigParams, PluginParams } from "../../types/common";

describe('CarbonAdvisorModel.Configuration', () => {
    // it('CarbonAdvisorModel.Configuration.MissingParams', async () => {
    //     const config : ConfigParams = {};
    //     const inputs : PluginParams[] = [];
    //     const model = CarbonAwareAdvisor(config);
    //     await expect(model.execute(inputs))
    //         .rejects.toThrow("Required Parameter allowed-locations not provided");
    // });

    it('CarbonAdvisorModel.Configuration.MissingParams', async () => {
        const config : ConfigParams = {
            "allowed-locations": []
        };
        const inputs : PluginParams[] = [];
        const model = CarbonAwareAdvisor(config);
        await expect(model.execute(inputs, config))
            .rejects.toThrow("Required Parameter allowed-locations is empty");
    });
});


// npm run test -- src/tests/models/CarbonAdvisorModel.test.ts