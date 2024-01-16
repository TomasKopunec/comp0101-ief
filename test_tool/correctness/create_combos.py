import yaml
from datetime import datetime, timedelta
from itertools import product
import ruamel.yaml
from ruamel.yaml.comments import CommentedMap, CommentedSeq
import json



# def replace_timestamps(data, timestamps_list, regions_list):
#     if isinstance(data, list):
#         return CommentedSeq([replace_timestamps(item, timestamps_list, regions_list) for item in data])
#     elif isinstance(data, dict):
#         ordered_data = CommentedMap()
#         for key, value in data.items():
#             if key.lower() == 'timestamp' and isinstance(value, str):
#                 ordered_data[key] = timestamps_list.pop(0)
#             elif key.lower() == 'region' and isinstance(value, str):
#                 ordered_data[key] = regions_list.pop(0)
#             else:
#                 ordered_data[key] = replace_timestamps(value, timestamps_list, regions_list)
#         return ordered_data
#     else:
#         return data

def parse_timestamp(timestamp):
    if ' - ' in timestamp:
        parts = map(str.strip, timestamp.split(' - '))
        
        start, end = parts
        start_time = datetime.strptime(start, '%Y-%m-%dT%H:%M')
        end_time = datetime.strptime(end, '%Y-%m-%dT%H:%M')
        current_time = start_time

        while current_time <= end_time:
            yield current_time.strftime('%Y-%m-%dT%H:%M')
            current_time += timedelta(hours=1)
        
    else:
        yield timestamp

def read_yaml_file(file_path):
    with open(file_path, 'r') as file:
        data = yaml.safe_load(file)
        timestamps_lists = data.get('timestamps', [])
        regions_lists = data.get('region', [])

    result_timestamps = []
    for timestamps in timestamps_lists:
        temp_list = []
        for timestamp in timestamps:
            temp_list.extend(parse_timestamp(timestamp))
        result_timestamps.append(temp_list)

    result_regions = []
    for regions in regions_lists:
        result_regions.append(regions)

    return result_timestamps, result_regions

def generate_combinations(lists):
    return list(product(*lists))

def extract_timestamps_and_locations(input_tuple):
    timestamps = []
    locations = []

    # Extract timestamps
    for timestamp in input_tuple[0]:
        timestamps.append(timestamp)

    # Extract locations
    for location in input_tuple[1]:
        locations.append(location)

    return timestamps, locations

def replace_timestamps(data, timestamps_list, regions_list):
    if isinstance(data, list):
        return CommentedSeq([replace_timestamps(item, timestamps_list, regions_list) for item in data])
    elif isinstance(data, dict):
        ordered_data = CommentedMap()
        for key, value in data.items():
            if key.lower() == 'timestamp' and isinstance(value, str):
                ordered_data[key] = timestamps_list.pop(0) if timestamps_list else value
            elif key.lower() == 'region' and isinstance(value, str):
                ordered_data[key] = regions_list.pop(0) if regions_list else value
            else:
                ordered_data[key] = replace_timestamps(value, timestamps_list, regions_list)
        return ordered_data
    else:
        return data

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
file_path = 'multiple_timestamps.yaml'
timestamps, regions = read_yaml_file(file_path)


timestamp_combinations = generate_combinations(timestamps)
region_combinations = generate_combinations(regions)

# print("Timestamp Combinations:")
# print(timestamp_combinations)

# print("\nRegion Combinations:")
# print(region_combinations)

all_combinations = list(product(timestamp_combinations, region_combinations))

# print("All Combinations:")
# print(all_combinations)
with open('data.json', 'w') as file:
    json.dump(all_combinations, file)

write_list_elements_with_indexes_to_file(all_combinations,"combos.txt")

yaml_file_path = 'template.yaml'

with open(yaml_file_path, 'r') as file:
    yaml_data = ruamel.yaml.YAML(typ='safe', pure=True).load(file)

for index, item in enumerate(all_combinations):
    time_list, location_list = extract_timestamps_and_locations(item)
    #print(time_list)
    #print(location_list)
    updated_yaml_data = replace_timestamps(yaml_data, time_list.copy(), location_list.copy())
    with open(f'inputs/updated_yaml_file_{index}.yaml', 'w') as file:
        ruamel.yaml.YAML().dump(updated_yaml_data, file)


