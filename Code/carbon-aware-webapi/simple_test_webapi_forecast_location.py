import requests
import pandas as pd

# Define the URL and query parameters
url = "http://localhost:5073/emissions/bylocation"
params = {
    "location": "westus",
    "time": "2022-08-23T14:00",
    "toTime": "2022-08-23T14:30"
}

# Make the GET request
response = requests.get(url, params=params)

# Check if the request was successful
if response.status_code == 200:
    # Convert the JSON response to a Python dictionary
    data = response.json()
    
    # Convert the dictionary to a pandas DataFrame
    # This step might need customization based on the structure of your response data
    df = pd.DataFrame([data])  # Assuming the response is a single JSON object
    # If the response is a list of JSON objects, you can directly pass it to DataFrame: df = pd.DataFrame(data)
    
    # Show the DataFrame (optional, for verification)
    print(df)
    
    # Save the DataFrame to a CSV file (or any other format you prefer)
    df.to_csv("emissions_data.csv", index=False)
else:
    print(f"Failed to retrieve data. Status code: {response.status_code}")
