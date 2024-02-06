import ruamel.yaml
from ruamel.yaml.comments import CommentedMap, CommentedSeq

def replace_timestamps(data, timestamps_list, regions_list):
    if isinstance(data, list):
        return CommentedSeq([replace_timestamps(item, timestamps_list, regions_list) for item in data])
    elif isinstance(data, dict):
        ordered_data = CommentedMap()
        for key, value in data.items():
            if key.lower() == 'timestamp' and isinstance(value, str):
                ordered_data[key] = timestamps_list.pop(0)
            elif key.lower() == 'region' and isinstance(value, str):
                ordered_data[key] = regions_list.pop(0)
            else:
                ordered_data[key] = replace_timestamps(value, timestamps_list, regions_list)
        return ordered_data
    else:
        return data

# Example usage:
yaml_file_path = 'template.yaml'
timestamps = ['2023-07-06T01:00', '2023-07-07T00:00', '2023-07-08T00:00']
regions = [ 'another_fake_region']

with open(yaml_file_path, 'r') as file:
    yaml_data = ruamel.yaml.YAML(typ='safe', pure=True).load(file)

updated_yaml_data = replace_timestamps(yaml_data, timestamps.copy(), regions.copy())

# Save the updated YAML data to a new file
with open('updated_yaml_file.yaml', 'w') as file:
    ruamel.yaml.YAML().dump(updated_yaml_data, file)
