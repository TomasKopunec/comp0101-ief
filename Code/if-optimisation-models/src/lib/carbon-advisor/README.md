# Carbon-aware

Questions:
- Assumption that past data of region is valid forecast (so no need to forecast, just use past data)
- How do we host the carbon-aware-sdk? Should we deploy it or can we assume the user will have the 
  API running locally? Do we just ask for the base URL?
- We can support either Azure (preferred) or AWS (or both?) - Different regions and locations
- We can only forecast three days in advance, how should we handle this?
- We need API key for WattTime or ElectricityMaps as we need to make some premium API calls, can we got my money pls :)
- Different APIs and cloud provides have different regions/locations, what combination is the best (I suggest WattTime/Azure)

ElectricityMaps
1. GET https://api.electricitymap.org/health (up status)
2. GET https://api.electricitymap.org/v3/carbon-intensity/latest - Live Carbon Intensity
3. GET https://api.electricitymap.org/v3/power-breakdown/latest - Live Power Breakdown
4. GET https://api.electricitymap.org/v3/carbon-intensity/forecast - Forecasted Carbon Intensity
5. GET https://api.electricitymap.org/v3/power-breakdown/forecast - Forecasted Power Breakdown
6. GET https://api.electricitymap.org/v3/carbon-intensity/past - Past carbon intesity between dates

WattTime
- Can only predict up to 72 hours
- Can get range of historical signal data
- Can determine grid region from provided lat/lon

Research
| Type                      | WattTime | ElectricityMaps | ElectricityMapsFree | JSON |
|---------------------------|----------|-----------------|---------------------|------|
| Is Emissions DataSource   |    ✅    |        ✅       |         ✅          |  ✅  |
| Is Forecast DataSource    |    ✅    |        ✅       |         ❌          |  ❌  |
| Makes HTTP(s) call        |    ✅    |        ✅       |         ✅          |  ❌  |
| Can Use Custom Data       |    ❌    |        ❌       |         ❌          |  ✅  |

| Methods                      | WattTime | ElectricityMaps | ElectricityMapsFree | JSON |
|----------------------------- |----------|-----------------|---------------------|------|
| GetCarbonIntensityAsync      |    ✅    |        ✅       |         ✅          |  ✅  | 
| GetCurrentForecastAsync      |    ✅    |        ✅       |         ❌          |  ❌  | 
| GetForecastByDateAsync       |    ✅    |        ❌       |         ❌          |  ❌  | 