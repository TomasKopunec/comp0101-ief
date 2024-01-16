import yaml
import os
from copy import deepcopy

def load_yaml_from_file(file_path):
    with open(file_path, 'r') as file:
        yaml_data = yaml.safe_load(file)
    return yaml_data

def load_timestamps_from_file(file_path):
    with open(file_path, 'r') as file:
        timestamps_data = yaml.safe_load(file)
    return timestamps_data.get('timestamps', [])

def find_and_replace_timestamps(data, timestamps, output_files):
    if isinstance(data, list):
        for i, item in enumerate(data):
            data[i] = find_and_replace_timestamps(item, timestamps, output_files)
    elif isinstance(data, dict):
        for key, value in data.items():
            data[key] = find_and_replace_timestamps(value, timestamps, output_files)
            if key.lower() == 'timestamp' and isinstance(data[key], str) and data[key].startswith('20') and len(data[key]) == 19:
                for timestamp in timestamps:
                    new_data = deepcopy(data)
                    new_data[key] = timestamp
                    output_files.append(new_data)
                # Break after the first instance of 'timestamp' is replaced
                break
    return data

def save_yaml_files(yaml_files, output_folder='output'):
    os.makedirs(output_folder, exist_ok=True)

    for i, yaml_data in enumerate(yaml_files):
        filename = os.path.join(output_folder, f"output_{i+1}.yaml")
        with open(filename, 'w') as file:
            yaml.dump(yaml_data, file, default_flow_style=False)

def main():
    template_yaml_file = "template.yaml"
    timestamps_file = "timestamps.yaml"

    template_yaml = load_yaml_from_file(template_yaml_file)
    potential_timestamps = load_timestamps_from_file(timestamps_file)

    output_files = []
    find_and_replace_timestamps(template_yaml, potential_timestamps, output_files)
    save_yaml_files(output_files)

if __name__ == "__main__":
    main()
