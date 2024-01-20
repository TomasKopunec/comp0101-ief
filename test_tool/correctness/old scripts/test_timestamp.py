import yaml
import os
from copy import deepcopy

def load_yaml_from_file(file_path):
    with open(file_path, 'r') as file:
        yaml_data = yaml.safe_load(file)
    return yaml_data

def generate_yaml_files(template_yaml, potential_timestamps):
    output_files = []

    for timestamps_list in potential_timestamps:
        current_template = deepcopy(template_yaml)
        replace_timestamps(current_template, timestamps_list)
        output_files.append(current_template)

    return output_files

def replace_timestamps(data, timestamps_list, regions_list ):
    if isinstance(data, list):
        for i, item in enumerate(data):
            data[i] = replace_timestamps(item, timestamps_list,regions_list)
    elif isinstance(data, dict):
        for key, value in data.items():
            data[key] = replace_timestamps(value, timestamps_list,regions_list)
            if key.lower() == 'timestamp' and isinstance(data[key], str) :
                data[key] = timestamps_list.pop(0)
            if key.lower() == 'region' and isinstance(data[key], str) :
                data[key] = regions_list.pop(0)       
    return data

def save_yaml_files(yaml_files, output_folder='output'):
    os.makedirs(output_folder, exist_ok=True)

    for i, yaml_data in enumerate(yaml_files):
        filename = os.path.join(output_folder, f"output_{i+1}.yaml")
        with open(filename, 'w') as file:
            yaml.dump(yaml_data, file, default_flow_style=False)

def main():
    template_yaml_file = "template.yaml"

    # List of lists with potential timestamps
    potential_timestamps = [
        ['2023-07-09T02:00', '2023-07-16T03:00', '2023-07-17T03:00', '2023-07-17T04:00', '2023-07-17T05:00'],
        ['2023-07-18T04:00', '2023-07-19T05:00', '2023-07-19T06:00', '2023-07-19T07:00', '2023-07-20T06:00']
    ]

    template_yaml = load_yaml_from_file(template_yaml_file)

    output_files = generate_yaml_files(template_yaml, potential_timestamps)
    save_yaml_files(output_files)

if __name__ == "__main__":
    main()
