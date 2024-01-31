import requests

# Define the URL
url = "http://127.0.0.1:5073/emissions/forecasts/current"

# Define the parameters
params = {
    'location': 'northeurope'
}

# Send a GET request
response = requests.get(url, params=params)

# Check if the request was successful
if response.status_code == 200:
    print("Request was successful.")
    # Print the content of the response (as text)
    print(response.text)
else:
    print(f"Request failed with status code: {response.status_code}")