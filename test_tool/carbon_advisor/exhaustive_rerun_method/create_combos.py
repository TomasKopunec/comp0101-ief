import yaml
from datetime import datetime, timedelta
from itertools import product
import ruamel.yaml
from ruamel.yaml.comments import CommentedMap, CommentedSeq
import json
import sys



def parse_timestamp(timestamp):
    if ' - ' in timestamp:
        parts = map(str.strip, timestamp.split(' - '))
        start, end = parts
        start_time = datetime.strptime(start, '%Y-%m-%dT%H:%M:%SZ')
        end_time = datetime.strptime(end, '%Y-%m-%dT%H:%M:%SZ')
        times_list=[]
        
        current_time = start_time

        while current_time <= end_time:
            times_list.append(current_time.strftime('%Y-%m-%dT%H:%M:%SZ'))
            current_time += timedelta(hours=1)
        return times_list
    else:
        raise ValueError(f"Error: timestamp format is not correct {timestamp}")

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
    timestamps_lists = recursive_search_for_key(data, 'allowed-timeframes')
    
    regions_lists = recursive_search_for_key(data, 'allowed-locations')
    
    
    result_timestamps=[]
    for timestamp in timestamps_lists:
        result_timestamps.extend(parse_timestamp(timestamp))
    result_regions = list(regions_lists)

    return result_timestamps, result_regions

def generate_combinations(lists):
    return list(product(*lists))

def update_yaml_time_location(data, new_time, new_location):
    """
    Recursively updates all instances of 'timestamp' and 'region' in the YAML data.

    :param data: The loaded YAML data as a Python dictionary or list.
    :param new_time: The new time value to replace all instances of 'timestamp'.
    :param new_location: The new location value to replace all instances of 'region'.
    """
    if isinstance(data, dict):
        for key, value in data.items():
            if key == 'timestamp':
                data[key] = new_time
            elif key == 'region':
                data[key] = new_location
            else:
                update_yaml_time_location(value, new_time, new_location)
    elif isinstance(data, list):
        for item in data:
            update_yaml_time_location(item, new_time, new_location)

def write_list_elements_with_indexes_to_file(input_list, output_file):
    with open(output_file, 'w') as file:
        for index, element in enumerate(input_list):
            if isinstance(element, tuple):
                file.write(f"Combination {index}:\n")
                for sub_element in element:
                    if isinstance(sub_element, tuple):
                        file.write("\t" + ', '.join(map(str, sub_element)) + "\n")
                    else:
                        file.write("\t" + str(sub_element) + "\n")
            else:
                file.write(f"Index {index}: {element}\n")
# Example usage
if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python script.py <allowed_locations_times_file_path> <impl_file_path>")
        sys.exit(1)

    input_file_path = sys.argv[2]
    allowed_file_path=sys.argv[1]
    with open(allowed_file_path, 'r') as file:
        data = yaml.safe_load(file)
    #print(data)
    timestamps, regions = read_yaml_file(data)
    print(timestamps)

   


    # print("Timestamp Combinations:")
    # print(timestamp_combinations)

    # print("\nRegion Combinations:")
    # print(region_combinations)

    all_combinations = list(product(timestamps, regions))

    print("All Combinations:")
    print(all_combinations)

    with open('data.json', 'w') as file:
        json.dump(all_combinations, file)

    write_list_elements_with_indexes_to_file(all_combinations,"combos.txt")

    yaml_file_path = input_file_path

    with open(yaml_file_path, 'r') as file:
        yaml_data = ruamel.yaml.YAML(typ='safe', pure=True).load(file)
        print(yaml_data)
    for index,item in enumerate(all_combinations):
        #get the time, location from the item
        (time, location) = item
       
       
        update_yaml_time_location(yaml_data, time, location)
        
        with open(f'inputs/updated_yaml_file_{index}.yaml', 'w') as file:
            ruamel.yaml.YAML().dump(yaml_data, file)


