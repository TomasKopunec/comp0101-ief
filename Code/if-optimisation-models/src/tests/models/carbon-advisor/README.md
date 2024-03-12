# Unit Tests
To run the whole test suite, run the following command from the if-optimization-models directory:
```
npm run test -- src/tests/models/carbon-advisor/CarbonAdvisorModelUnit.test.ts
```

or to run specific tests:

```
npm run test -- src/tests/models/carbon-advisor/CarbonAdvisorModelUnit.test.ts --testNamePattern="CarbonAdvisorModel.Unit.TimeframeEmptyArr"
```

# Scenarios
To run the whole test suite, run the following command from the if-optimization-models directory:
```
npm run test -- src/tests/models/carbon-advisor/CarbonAdvisorModelScenarios.test.ts
```

or to run specific tests:

```
npm run test -- src/tests/models/carbon-advisor/CarbonAdvisorModelScenarios.test.ts --testNamePattern="CarbonAdvisorModel.Scenario1"
```

# Forecasting tests
To run individual tests, run the following command from the if-optimization-models directory:
```
npm run test -- src/tests/models/carbon-advisor/CarbonAdvisorModelForecasting.test.ts --testNamePattern="CarbonAdvisorModel.Forecasting.{Scenario}"
```
replacing *{Scenario}* with the scenario number, for example:
```
npm run test -- src/tests/models/carbon-advisor/CarbonAdvisorModelForecasting.test.ts --testNamePattern="CarbonAdvisorModel.Forecasting.Scenario1"
```
which would run only the Scenario 1 test.

Before running any scenario tests, the carbon-aware-sdk WebAPI must be running with the right data source configuration. Each scenario requires a different data input, which has to be adjusted in the **appsettings.json** file, as follows:
```
"DataSources": {
    "EmissionsDataSource": "test-json",
    "ForecastDataSource": "ElectricityMaps",
    "Configurations": {
      "test-json": {
        "Type": "JSON",
        "DataFileLocation": "{scenario JSON file}"
      },
      "ElectricityMaps": {
        "Type": "ElectricityMaps",
        "APITokenHeader": "auth-token",
        "APIToken": "jDLmBL4tkhr4LDrzuUj3i96077Ozj3g1",
        "BaseURL": "https://api-access.electricitymaps.com/2w97h07rvxvuaa1g/"
      }
    }
  }
```

For example, if you want to run the Scenario 1, you would need to place **scenario1.json**
under the following path in the carbon-sdk repository:
```
src/data/data-sources/scenario1.json
```

In the Table below, the requirements of individual scenarios can be found:
| Scenario   | Data Input     |
| ---------- | -------------- |
| Scenario 1 | scenario1.json |
| Scenario 2 | scenario2.json |
| Scenario 3 | scenario3.json |
| Scenario 4 | scenario3.json |
| Scenario 5 | scenario3.json |
| Scenario 6 | scenario3.json |