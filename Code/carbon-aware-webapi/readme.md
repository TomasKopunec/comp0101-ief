# Qucik Call Carbon Aware WebApi on Local Container

Please refer to this for more information, but there are too many errors in this document! [Carbon Aware SDK Docs](https://github.com/Green-Software-Foundation/carbon-aware-sdk/tree/dev/docs)

## Prerequisites:

- .NET Core 6.0
- Alternatively:
  - Docker
  - VSCode (it is recommended to work in a Dev Container)
  - Remote Containers extension for VSCode:
    <https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers>


Optional(Can be skipped, as the code provides the token for the test):
- Access to one (or all) of the supported external data APIs
  - WattTime account - See
    [instruction on WattTime](https://docs.watttime.org/#tag/Authentication/operation/post_username_register_post)
    for details (or use our python samples as described
    [here](../samples/watttime-registration/readme.md)).
  - ElectricityMaps account - See
    [instruction on ElectricityMaps](https://api-portal.electricitymaps.com/home)
    for details (or setup a
    [free trial](https://api-portal.electricitymaps.com)). Note that the free
    trial has some
    [restrictions](./docs/selecting-a-data-source.md#restrictions-electricitymaps-free-trial-user)
  - ElectricityMapsFree account - See
    [instruction on ElectricityMapsFree](https://www.co2signal.com/#Subscriber-Email)
    for details.


## Download & Deploy & Run

1. git clone https://github.com/Green-Software-Foundation/carbon-aware-sdk.git
2. Open VSCode and Docker
3. Open VSCode Command Palette: (Linux/Windows: `ctrl + shift + P`, MacOS: `cmd + shift + P`), and run the command: `Dev Containers: Open Folder in Container` to open carbon-aware-sdk (Starting Dev Container for the first time will take a while)
4. Change directory to: `cd src/CarbonAware.WebApi/src`
5. Replace the appsettings.json file with the following
```
{
  "LocationDataSourcesConfiguration": {
    "LocationSourceFiles": [
      {
        "DataFileLocation": "azure-regions.json"
      },
      {
        "DataFileLocation": "custom-azure-zones.json",
        "Prefix": "zone",
        "Delimiter": "."
      }
    ]
  },
  "DataSources": {
    "EmissionsDataSource": "ElectricityMaps",
    "ForecastDataSource": "ElectricityMaps",
    "Configurations": {
      "ElectricityMaps": {
        "Type": "ElectricityMaps",
        "APITokenHeader": "auth-token",
        "APIToken": "jDLmBL4tkhr4LDrzuUj3i96077Ozj3g1",
        "BaseURL": "https://api-access.electricitymaps.com/2w97h07rvxvuaa1g/"
      }
    }
  }
}
```
6. Run in Terminal: `dotnet run` , default running at 127.0.0.1:5073

## Get data

Also available via Python or postman, etc. Listed below are the terminal codes.
It may fail the first time you run it, run it again.

### Emissions
```
curl "http://localhost:5073/emissions/bylocation?location=westus&time=2022-08-23T14%3A00&toTime=2022-08-23T14%3A30"
```
### Forecasts
```
curl "http://localhost:5073/emissions/forecasts/current?location=westus"
```

## Locations.json
italynorth, Polandcentral, Israelcentral, and Qatarcentral: These 4 locations api will return "Unknown Location: 'xxx' not found.
uaecentral, uaenorth: These 2 locations api can't return anything.

## More
The python script here is just a simple demonstration, a more scientific approach would be to go through the default Calling the Web API via client libraries of this docus: https://github.com/Green-Software-Foundation/carbon-aware-sdk/blob/dev/docs/quickstart.md.
