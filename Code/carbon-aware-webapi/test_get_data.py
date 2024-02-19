import requests
import json
from datetime import datetime, timedelta

url = "http://localhost:5073/emissions/bylocation"

# List of locations to query
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
    "westus3", "canadacentral", "canadaeast","centraluseuap","eastus2euap"
]


# world_azure_locations = [
#     "uksouth", "ukwest"
# ]

# Start and end dates for the overall query
start_date = datetime(2021, 1, 1)
end_date = datetime.now() - timedelta(days=1)  # Yesterday

# Initialize an empty list to store results from all locations and dates
all_results = []

# Function to generate date ranges in 10-day intervals
def generate_date_ranges(start, end):
    while start < end:
        yield start, min(start + timedelta(days=9), end)
        start += timedelta(days=10)

# Function to display a simple progress bar
def print_progress_bar(iteration, total, prefix='', suffix='', length=50, fill='█'):
    percent = ("{0:.1f}").format(100 * (iteration / float(total)))
    filled_length = int(length * iteration // total)
    bar = fill * filled_length + '-' * (length - filled_length)
    print(f'\r{prefix} |{bar}| {percent}% {suffix}', end='\r')
    if iteration == total: 
        print()

# Calculate total number of iterations for progress tracking
total_iterations = sum(1 for _ in generate_date_ranges(start_date, end_date)) * len(world_azure_locations)
current_iteration = 0

print("Starting data fetch process...")

# Iterate over each location
for location in world_azure_locations:
    print(f"\nFetching data for location: {location}")
    # Generate date ranges and query for each range
    for start, end in generate_date_ranges(start_date, end_date):
        time_param = start.strftime('%Y-%m-%d')
        to_time_param = end.strftime('%Y-%m-%d')
        
        print(f"Fetching data from {time_param} to {to_time_param}...")
        
        params = {
            "location": location,
            "time": time_param,
            "toTime": to_time_param
        }
        
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            all_results.extend(data)
        else:
            print(f"Failed to fetch data for {location} from {time_param} to {to_time_param}, status code: {response.status_code}")
        
        # Update progress
        current_iteration += 1
        print_progress_bar(current_iteration, total_iterations, prefix = 'Progress:', suffix = 'Complete', length = 50)

# Transform the data to match the requested format
transformed_data = [
    {
        "Location": item["location"],
        "Time": item["time"],
        "Rating": item["rating"],
        "Duration": item["duration"]
    } for item in all_results
]

# Encapsulate the transformed data within an "Emissions" key
output_data = {"Emissions": transformed_data}

file_path = "emissions_data.json"

# Write the data to the file
with open(file_path, 'w') as file:
    json.dump(output_data, file, indent=4)

print("\nData fetch process completed successfully.")
print(f"Data saved to {file_path}")