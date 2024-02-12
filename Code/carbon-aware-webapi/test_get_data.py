import requests
import pandas as pd

# Define the URL and query parameters
url = "http://localhost:5073/emissions/bylocations"  # Adjusted for multiple locations

# Full set of locations from 'world_azure'
world_azure_locations = [
    "southafricanorth", "southafricawest", "australiacentral", "australiacentral2",
    "australiaeast", "australiasoutheast", "centralindia", "eastasia", "japaneast",
    "japanwest", "jioindiacentral", "jioindiawest", "koreacentral", "koreasouth",
    "southeastasia", "southindia", "westindia", "francecentral", "francesouth",
    "germanynorth", "germanywestcentral", "italynorth", "northeurope", "norwayeast",
    "norwaywest", "polandcentral", "swedencentral", "switzerlandnorth",
    "switzerlandwest", "uksouth", "ukwest", "westeurope", "israelcentral", "qatarcentral",
    "uaecentral", "uaenorth", "brazilsouth", "brazilsoutheast", "centralus", "eastus",
    "eastus2", "northcentralus", "southcentralus", "westcentralus", "westus", "westus2",
    "westus3", "canadacentral", "canadaeast"
]

params = {
    "location": world_azure_locations,  # Assign the full set of locations
    "time": "2021-11-17T12:45",
    "toTime": "2022-11-17T04:46"
}

# Make the GET request
response = requests.get(url, params=params)

# Check if the request was successful
if response.status_code == 200:
    # Convert the JSON response to a list of dictionaries
    data = response.json()
    
    # Assuming the response data structure is suitable for direct conversion to DataFrame
    df = pd.DataFrame(data)
    
    # Set DataFrame index starting from 1
    df.index = df.index + 1
    
    # Optionally print the DataFrame for verification
    print(df)
    
    # Save the DataFrame to a CSV, with row numbering starting from 1
    df.to_csv("emissions_data_full_locations.csv", index=True, index_label="Row")
else:
    print(f"Failed to retrieve data. Status code: {response.status_code}")
