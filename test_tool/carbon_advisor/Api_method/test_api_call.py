import requests
import json
# Define the URL
#url = "http://localhost:5073/emissions/forecasts/current"
#https://<server_name>/emissions/bylocations/best?locations=eastus&locations=westus&time=2022-01-01&toTime=2022-05-17
url ="http://localhost:5073/emissions/bylocations/best"
# Define the parameters
params = {
    'location': ['northeurope','eastus'],
    'dataStartAt': '2024-07-19T14:00:00Z',
    'dataEndAt': '2024-07-19T19:00:00Z',
    'windowSize': '10'
    }

params1 = {
    'location': ['northeurope','eastus','westus'],
    'time': '2022-07-19T14:00:00Z',
    'toTime': '2022-07-31T19:00:00Z'
}

all_data = []
# Send a GET request
response = requests.get(url, params=params1)

# Check if the request was successful
if response.status_code == 200:
    print("Request was successful.")
    data = json.loads(response.text)
    data2= json.loads(response.text)
    all_data.extend(data)
    all_data.extend(data2)

    # Access and print the 'value' from 'optimalDataPoints' 
    
    # Print the content of the response (as text)
    
else:
    print(f"Request failed with status code: {response.status_code}")


print(all_data)