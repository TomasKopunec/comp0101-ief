import yaml
import json
import requests
import sys

# Function to make an API call and return the best timeframe, location, and carbon emission results
def get_best_per_timeframe(start_time, finish_time, regions_list):
    url = "http://localhost:5073/emissions/bylocations/best"
    params = {
        'location': regions_list,
        'time': start_time,
        'toTime': finish_time
    }
    print(params)  # Debugging: Print the parameters for the request
    response = requests.get(url, params=params)
    
    if response.status_code == 200:
        data = json.loads(response.text)
        return data
    else:
        raise ValueError(f"Request failed with status code: {response.status_code}")

# Function to parse a timestamp string into start and end times
def parse_timestamp(timestamp):
    if ' - ' in timestamp:
        start, end = map(str.strip, timestamp.split(' - '))
        return start, end
    else:
        raise ValueError(f"Error: timestamp format is not correct {timestamp}")

# Recursive function to search for a key in nested dictionaries and lists
def recursive_search_for_key(data, target_key):
    if isinstance(data, dict):
        for key, value in data.items():
            if key == target_key:
                return value
            result = recursive_search_for_key(value, target_key)
            if result is not None:
                return result
    elif isinstance(data, list):
        for item in data:
            result = recursive_search_for_key(item, target_key)
            if result is not None:
                return result
    return None

# Function to read a YAML file and extract the timestamps and regions
def read_yaml_file(data):
    regions_lists = recursive_search_for_key(data, 'allowed-locations')
    timestamps_lists = recursive_search_for_key(data, 'allowed-timeframes')

    result_timestamps = [(start, finish) for timestamp in timestamps_lists for start, finish in [parse_timestamp(timestamp)]]
    result_regions = list(regions_lists)

    return result_timestamps, result_regions

# Function to find items with the lowest rating in a list of dictionaries
def find_items_with_lowest_rating(data):
    lowest_rating = float('inf')
    lowest_rating_items = []

    for item in data:
        rating = item.get('rating', float('inf'))  # Use get with default if key is missing
        if rating < lowest_rating:
            lowest_rating = rating
            lowest_rating_items = [item]
        elif rating == lowest_rating:
            lowest_rating_items.append(item)

    return lowest_rating_items

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python script.py <input_file_path>")
        sys.exit(1)

    input_file_path = sys.argv[1]
    output_file_path = input_file_path.rsplit('.', 1)[0] + "_ompl." + input_file_path.rsplit('.', 1)[1]

    with open(input_file_path, 'r') as file:
        data = yaml.safe_load(file)

    all_data = []
    timestamps, regions = read_yaml_file(data)

    for start_time, finish_time in timestamps:
        all_data.extend(get_best_per_timeframe(start_time, finish_time, regions))

    print("\nFinal Result:")
    print(all_data)

    lowest_rating_items = find_items_with_lowest_rating(all_data)
    print("Items with the lowest rating:")
    for item in lowest_rating_items:
        print(item)

    output_list = [{'location': item['location'], 'rating': item['rating'], 'time': item['time'], 'duration': item['duration']} for item in lowest_rating_items]
    data['output'] = output_list

    with open(output_file_path, 'w') as file:
        yaml.dump(data, file, default_flow_style=False, sort_keys=False)