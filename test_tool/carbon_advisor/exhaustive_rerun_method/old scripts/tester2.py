import yaml
def replace_timestamps(data, timestamps_list, regions_list):
    if isinstance(data, list):
        for i, item in enumerate(data):
            data[i] = replace_timestamps(item, timestamps_list, regions_list)
    elif isinstance(data, dict):
        for key, value in data.items():
            if key.lower() == 'timestamp' and isinstance(value, str):
                data[key] = timestamps_list.pop(0)
            elif key.lower() == 'region' and isinstance(value, str):
                data[key] = regions_list.pop(0)
            else:
                data[key] = replace_timestamps(value, timestamps_list, regions_list)
    return data

yaml_file_path = 'template.yaml'  #
# Example usage:
with open(yaml_file_path, 'r') as file:
        yaml_data = yaml.safe_load(file)
timestamps = ['2023-07-06T01:10', '2023-07-07T00:00', '2023-07-08T00:00']
regions = ['another_fake_region']

updated_yaml_data = replace_timestamps(yaml_data, timestamps.copy(), regions.copy())

# Save the updated YAML data to a new file
with open('updated_yaml_file.yaml', 'w') as file:
    yaml.dump(updated_yaml_data, file, default_flow_style=False)
