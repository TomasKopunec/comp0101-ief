from ruamel.yaml.comments import CommentedSeq, CommentedMap
import os
import yaml
import json


def find_best(data, metric):
    if isinstance(data, list):
        return [item for sublist in [find_best(item, metric) for item in data] for item in sublist]
    elif isinstance(data, dict):
        result = []
        for key, value in data.items():
            if key.lower() == metric and isinstance(value, (int, float)):
                result.append(value)
            elif isinstance(value, (list, dict)):
                result.extend(find_best(value, metric))
        return result
    return []

def process_yaml_files(directory, metric):
    result = {}
    for filename in os.listdir(directory):
        if filename.endswith(".yaml"):
            file_path = os.path.join(directory, filename)
            with open(file_path, 'r') as file:
                yaml_data = yaml.load(file, Loader=yaml.Loader)
                processed_data = find_best(yaml_data, metric)

                if processed_data:
                    file_number = extract_number_from_filename(filename)
                    if file_number is not None:
                        result[file_number] = processed_data[-1]
    return result

def extract_number_from_filename(filename):
    # Extracts any number from the filename before the .yaml extension
    try:
        return int(''.join(filter(str.isdigit, filename.split(".yaml")[0])))
    except ValueError:
        return None
    

def find_keys_with_min_value(my_dict):
    if not my_dict:
        return []

    # Find the minimum value
    min_value = min(my_dict.values())

    # Find keys with the minimum value
    keys_with_min_value = [key for key, value in my_dict.items() if value == min_value]

    return keys_with_min_value


# Example usage
directory_path = './outputs'
metric_name = 'aggregated-carbon'
result = process_yaml_files(directory_path, metric_name)
print(result)


with open('data.json', 'r') as file:
    loaded_data = json.load(file)

# Convert the list to a dictionary with indices as keys
loaded_dict = {index: item for index, item in enumerate(loaded_data)}

# loaded_dict will be a dictionary with keys as indices
print(loaded_dict)
best_values_list= find_keys_with_min_value(result)
print(best_values_list)
for item in best_values_list:
    best_value = result[item]
    best_specification = loaded_dict[item]
    print(f"The best combo is {item} with value {best_value} and with specification {best_specification}")

