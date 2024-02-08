
# CarbonAdvisor Model

## Overview
The CarbonAdvisor model is designed to provide carbon emission data based on specified locations and timeframes. It interacts with the Carbon Aware SDK to fetch the most carbon-efficient options for given parameters.

## Key Features
- **Location Filtering**: Users can specify a list of locations to consider for carbon emission data.
- **Timeframe Filtering**: Users can define time ranges to narrow down the search for carbon emission data.
- **Sampling**: An optional parameter that allows users to specify the number of data points to sample from the available data, providing a broader view of the carbon emission landscape. If sampling is not defined in the impl then no data points are sampled and the plotted_points is not added in the ompl.

## Outputs
- ** Suggestions: **: List of the best location and time combination to minimize the carbon score along with that score.
- ** Plotted-points: **: ONLY IF THE LISTING PARAMETER IS INITIALIZED IN THE IMPL. A sampling number of samples for trade-off visualization. A best combination from each timeframe is alwayes included . SO sampling must be >= number of time regions in the allowed-timeframes. The plotter model can then be used in a pipeline to plot this samples.

## Prerequisites
- The Carbon Aware Web API must be running locally (default: `http://localhost:5073`).
- Ensure `axios` and `qs` libraries are installed in your environment.

## Instructions to get Carbon Aware Web API running locally
Please refer to this for more information, but there are too many errors in this document! [Carbon Aware SDK Docs](https://github.com/Green-Software-Foundation/carbon-aware-sdk/tree/dev/docs)

  Prerequisites:

- .NET Core 6.0
- Alternatively:
  - Docker
  - VSCode (it is recommended to work in a Dev Container)
  - Remote Containers extension for VSCode:
    <https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers>



1. git clone https://github.com/Green-Software-Foundation/carbon-aware-sdk.git
2. Open VSCode and Docker
3. Open VSCode Command Palette: (Linux/Windows: `ctrl + shift + P`, MacOS: `cmd + shift + P`), and run the command: `Dev Containers: Open Folder in Container` to open carbon-aware-sdk folder you just cloned (Starting Dev Container for the first time will take a while)
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
    "EmissionsDataSource": "test-json",
    "ForecastDataSource": "ElectricityMaps",
    "Configurations": {
      "test-json": {
        "Type": "JSON",
        "DataFileLocation": "test-data-azure-emissions.json"
      },
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




## Configuration
The model requires two main parameters to be configured in the impl file:
- `allowed-locations`: A list of locations for which the carbon data is required.
- `allowed-timeframes`: A list of timeframes in the format `YYYY-MM-DDTHH:MM:SSZ - YYYY-MM-DDTHH:MM:SSZ`.

Optional parameter:
- `sampling`: Specifies the number of data points to sample from the returned data for a more granular analysis.

## Example Impl Configuration without sampling
Impl:

```yaml
name: Carbon Advisor Demo
description: Simple demo for invoking carbon-advisor model
initialize:
  models:
    - name: carbon-advisor
      model: CarbonAdvisor
      path: "@grnsft/if-optimisation-models"
graph:
  children:
    child:
      pipeline:
        - carbon-advisor
      config:
        carbon-advisor:
          allowed-locations: ['northeurope', 'eastus', 'westus']
          allowed-timeframes: [
            "2022-07-19T14:00:00Z - 2022-07-31T19:00:00Z",
            "2022-08-01T19:00:00Z - 2022-08-03T20:35:31Z"
          ]
```
Ompl: 

```yaml
name: Carbon Advisor Demo
description: Simple demo for invoking carbon-advisor model
tags: null
initialize:
  models:
    - name: carbon-advisor
      path: '@grnsft/if-optimisation-models'
      model: CarbonAdvisor
graph:
  children:
    child:
      pipeline:
        - carbon-advisor
      config:
        carbon-advisor:
          allowed-locations:
            - northeurope
            - eastus
            - westus
          allowed-timeframes:
            - 2022-07-19T14:00:00Z - 2022-07-31T19:00:00Z
            - 2022-08-01T19:00:00Z - 2022-08-03T20:35:31Z
      inputs:
        - timestamp: 2023-07-06T00:00
          duration: 3600
          cloud-vendor: azure
          cloud-instance-type: Standard_NC24s_v3
      outputs:
        - timestamp: 2023-07-06T00:00
          duration: 3600
          cloud-vendor: azure
          cloud-instance-type: Standard_NC24s_v3
          allowed-locations:
            - northeurope
            - eastus
            - westus
          allowed-timeframes:
            - 2022-07-19T14:00:00Z - 2022-07-31T19:00:00Z
            - 2022-08-01T19:00:00Z - 2022-08-03T20:35:31Z
          suggestions:
            - suggested-location: northeurope
              suggested-timeframe: '2022-07-21T04:45:11+00:00'
              suggested-score: 0
            - suggested-location: eastus
              suggested-timeframe: '2022-08-02T20:45:11+00:00'
              suggested-score: 0
          plotted_points: []
```

## Example configuration with sampling and plotter model to visualize the data
Impl:
```yaml
name: plot-demo
description: example impl invoking carbon advisor and Plotter model
tags:
initialize:
  models:
    - name: carbon-advisor
      model: CarbonAdvisor
      path: "@grnsft/if-optimisation-models"
    - name: plotter
      model: ShellModel
      path: "@grnsft/if-models"
graph:
  children:
    child:
      pipeline:
        - carbon-advisor
        - plotter
      config:
        carbon-advisor:
          allowed-locations:  ['northeurope','eastus','westus']
          allowed-timeframes: [
            "2022-07-19T14:00:00Z - 2022-07-31T19:00:00Z",
            "2022-08-01T19:00:00Z - 2022-08-03T20:35:31Z"
          ]
          sampling: 6
        plotter:
          command: 'python3 ./src/lib/visualizer/plotter'
          x_name:  [location,time]
          y_name: score
          colour: blue
          diagram_name: demo
          x_axis_name: Date and Location
          y_axis_name: Carbon score
          diagram_title: Carbon score in relation to time and location (ascending)
          graph_type: line # bar line or scatter
      inputs:
        -  
```
Ompl:
```yaml
name: shell-demo
description: example impl invoking shell model
tags: null
initialize:
  models:
    - name: carbon-advisor
      path: '@grnsft/if-optimisation-models'
      model: CarbonAdvisor
    - name: plotter
      path: '@grnsft/if-models'
      model: ShellModel
graph:
  children:
    child:
      pipeline:
        - carbon-advisor
        - plotter
      config:
        carbon-advisor:
          allowed-locations:
            - northeurope
            - eastus
            - westus
          allowed-timeframes:
            - 2022-07-19T14:00:00Z - 2022-07-31T19:00:00Z
            - 2022-08-01T19:00:00Z - 2022-08-03T20:35:31Z
          sampling: 6
        plotter:
          command: python3 ./src/lib/visualizer/plotter
          x_name:
            - location
            - time
          y_name: score
          colour: blue
          diagram_name: demo
          x_axis_name: Date and Location
          y_axis_name: Carbon score
          diagram_title: Carbon score in relation to time and location (ascending)
          graph_type: line
      inputs:
        - null
      outputs:
        - allowed-locations:
            - northeurope
            - eastus
            - westus
          allowed-timeframes:
            - 2022-07-19T14:00:00Z - 2022-07-31T19:00:00Z
            - 2022-08-01T19:00:00Z - 2022-08-03T20:35:31Z
          sampling: 6
          command: python3 ./src/lib/visualizer/plotter
          x_name:
            - location
            - time
          y_name: score
          colour: blue
          diagram_name: demo
          x_axis_name: Date and Location
          y_axis_name: Carbon score
          diagram_title: Carbon score in relation to time and location (ascending)
          graph_type: line
          suggestions:
            - suggested-location: northeurope
              suggested-timeframe: '2022-07-21T04:45:11+00:00'
              suggested-score: 0
            - suggested-location: eastus
              suggested-timeframe: '2022-08-02T20:45:11+00:00'
              suggested-score: 0
          plotted_points:
            - location: northeurope
              time: '2022-07-21T04:45:11+00:00'
              score: 0
            - location: eastus
              time: '2022-08-02T20:45:11+00:00'
              score: 0
            - location: westus
              time: '2022-07-30T04:45:11+00:00'
              score: 60
            - location: northeurope
              time: '2022-07-26T20:45:11+00:00'
              score: 81
            - location: eastus
              time: '2022-07-20T12:45:11+00:00'
              score: 73
            - location: northeurope
              time: '2022-07-24T12:45:11+00:00'
              score: 72
          diagram: /home/jim/comp0101-ief/Code/if-optimisation-models/demo.png

```
And we can see the following diagram being created:
![Alt text](example.png)

## Usage
1. Define the required configuration in an impl file as shown in the example above.
2. Invoke the CarbonAdvisor model within your pipeline.
3. Optionally, add the `plotter` model to visualize the carbon emission data.

## Integrating with Plotter
To visualize the carbon emission data, integrate the `CarbonAdvisor` model with the `plotter` model in your pipeline. Provide the necessary configurations for both models as per your requirements. The plotter model will automatically go through the plotted-points to search for the data so the x_name should be defined as [location, time] and the y_name as score.

## Contributing
Contributions to the CarbonAdvisor model are welcome. Please submit pull requests with any enhancements, bug fixes, or additional features you'd like to add.


## Future Forcasts 
Since future forcasts are not available (for more than one day later ) through the API we need to implement our own solution.
It will be based on a weighted average of past years.
So the algorith is as follows:
If a timeframe range is after the current datetime then replace the year with the previous one.
Calculate the best time for that time range lets call it time A with Score A.
For that best time do 3 more APi calls for the 4 previous years getting scores B, C, D.
If There is no score B make B=0,B1=0 else make B1=0.25 
If There is no score C makeC=0, C1=0 else make C1=0.15 
If There is no score D make D=0,D1=0 else make D1=0.10 
Then return the best time A with score = (0.5A+ 0.25 B + 0.15C +0.10D) /(0.5+B1+C1+D1)


alternative approach that is more accurate but much more api calls
If a timeframe range is after the current datetime then replace the year with the year-1 :Timeframe range 1
replace the year with the year-2 :Timeframe range 2
replace the year with the year-3 :Timeframe range 3
replace the year with the year-4 :Timeframe range 4
for of the timeframes 1 2 3 4 do api calls and get the best so A1 , A2, A3, A4
for every of the A1, A2, A3, A4 do this:
lets say for A1
do 3 more APi calls for the other 3 years (with same date and time except year as A1):so get values A11=A1 , A12, A13, A14
find total score for A1 as done in te previous alternative 

so in the end you have score A1 for time A1 in timeframe range 1
score A2 for time A2 in timeframe range 2
score A3 for time A3 in timeframe range 3
score A4 for time A4 in timeframe range 4.

Select form 1 ,2 ,3 or 4 the one with the best score and return that
