import json

# Function to read and parse a JSON file
def read_json_file(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)

# Paths to your JSON files
file_path1 = '../src/lib/right-sizing/aws-instances.json'  # Update this path
file_path2 = '../src/lib/right-sizing/azure-instances.json' # Update this path azure-instances/home/jim/comp0101-ief/Code/if-optimisation-models/src/lib/right-sizing/azure-instances.json

# Reading and parsing the JSON files
json_data1 = read_json_file(file_path1)
json_data2 = read_json_file(file_path2)

# Function to find duplicate model names
def find_duplicate_models(json_data1, json_data2):
    models1 = set()
    for models in json_data1.values():
        for model in models:
            models1.add(model['model'])

    duplicates = set()
    for models in json_data2.values():
        for model in models:
            if model['model'] in models1:
                duplicates.add(model['model'])

    return duplicates

# Finding and printing duplicate model names
duplicates = find_duplicate_models(json_data1, json_data2)
if duplicates:
    print("Duplicate model names found:", duplicates)
else:
    print("No duplicate model names found.")
