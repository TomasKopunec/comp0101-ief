import requests
import json
# Define the URL
url = "http://localhost:5073/emissions/forecasts/current"

# Define the parameters
params = {
    'location': 'northeurope'
}

# Send a GET request
response = requests.get(url, params=params)

# Check if the request was successful
if response.status_code == 200:
    print("Request was successful.")
    data = json.loads(response.text)

    # Access and print the 'value' from 'optimalDataPoints'
    print(data[0]['optimalDataPoints'][0]['value'])
    # Print the content of the response (as text)
    
else:
    print(f"Request failed with status code: {response.status_code}")