import yaml
import sys
import json
import right_sizing_for_azure
from collections import Counter



def find_pairs(data, key1, key2):
    pairs = []
    
    if isinstance(data, dict):
        # Check if both keys exist in this dictionary
        if key1 in data and key2 in data:
            pairs.append((data[key1], data[key2]))
        # Recursively search in values
        for value in data.values():
            pairs.extend(find_pairs(value, key1, key2))
            
    elif isinstance(data, list):
        # Recursively search in items
        for item in data:
            pairs.extend(find_pairs(item, key1, key2))
    
    return pairs

def read_yaml_file(file_path):
    with open(file_path, 'r') as file:
        data = yaml.safe_load(file)
    
    # Extract pairs of cpu-util and cloud-instance-type
    pairs = find_pairs(data, 'cpu-util', 'cloud-instance-type')
    
    return pairs

def find_cpu_family_and_details(cpu_name, dict1, dict2):
    # Combine both dictionaries into a list for easier iteration
    combined_dicts = [dict1, dict2]
    
    for cpu_dict in combined_dicts:
        for family, models in cpu_dict.items():
            for model_info in models:
                if model_info['model'] == cpu_name:
                    # Return the vCPU count and the family details
                    return model_info['vCPUs'], models
    
    # Return None if the CPU model is not found
    return None, None

def find_optimal_combinations(models, x, current_combo=None, current_sum=0, best_combos=None, best_sum=None):
    if current_combo is None:
        current_combo = []
    if best_combos is None:
        best_combos = []
    if best_sum is None:
        best_sum = float('inf')

    # Check if the current combination is better than the best known
    if current_sum >= x and current_sum < best_sum:
        best_combos = [current_combo]
        best_sum = current_sum
    elif current_sum == best_sum:
        best_combos.append(current_combo)

    # Recursively explore further combinations if the current sum is less than the best sum
    if current_sum < best_sum:
        for model in models:
            new_combo = current_combo + [model['model']]
            new_sum = current_sum + model['vCPUs']
            best_combos, best_sum = find_optimal_combinations(models, x, new_combo, new_sum, best_combos, best_sum)

    return best_combos, best_sum

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python script.py <yaml_file_path>")
        sys.exit(1)

    input_file_path = sys.argv[1]
    cpu_util_instance_pairs = read_yaml_file(input_file_path)
    
    for pair in cpu_util_instance_pairs:
        util, instance = pair
        print(util, instance)

    # Path to your JSON files
    file_path1 = 'aws-instances.json'
    file_path2 = 'azure-instances.json'

    # Read the first JSON file
    with open(file_path1, 'r') as file:
        aws = json.load(file)

    # Read the second JSON file
    with open(file_path2, 'r') as file:
        azure = json.load(file)

    # for pair in cpu_util_instance_pairs:
    #     util, cpu_name = pair
    #     vcpus, family_details = find_cpu_family_and_details(cpu_name, azure, aws)
    #     x=util*vcpus
    #     if vcpus is not None:
    #         print(f"vCPUs for {cpu_name}: {vcpus}")
    #         print(f"Family details for {cpu_name}: {family_details}")
    #     else:
    #         print(f"CPU model {cpu_name} not found.")

        
        
    #     optimal_combos, best_sum = find_optimal_combinations(family_details, x)
    #     print(f"Combinations for : {cpu_name}, with utilization {util} and Total vCPUs: {x}")
    #     for combo in optimal_combos:
    #         print(f"Combination: {combo}, Total vCPUs: {best_sum}")


    # Load JSON data from file
    # with open('results.json', 'r') as file:
    #     json_data = json.load(file)


    # New method that doesn't require reading json
    results, inputs = right_sizing_for_azure.process_config_file(input_file_path)
    json_data = right_sizing_for_azure.output_results(results, inputs)




    

for pair in cpu_util_instance_pairs:
    util, cpu_name = pair

    # Find JSON entry matching the current pair
    matching_entry = next((item for item in json_data if item["old_cpu"] == cpu_name and item["old_util"] == util), None)

    if matching_entry:
        vcpus, family_details = find_cpu_family_and_details(cpu_name, azure, aws)
        if vcpus is not None:
            x = util * vcpus
            print(f"vCPUs for {cpu_name}: {vcpus}")
            print(f"Family details for {cpu_name}: {family_details}")

            optimal_combos, best_sum = find_optimal_combinations(family_details, x)

            # Convert new_cpus list and each optimal combo to Counter objects for comparison
            new_cpus_counter = Counter(matching_entry["new_cpus"])
            optimal_combos_counters = [Counter(combo) for combo in optimal_combos]
            
            # Check if new_util * vcpus equals best_sum and if new_cpus is in optimal_combos
            
            if matching_entry["new_util"] * best_sum == x and  new_cpus_counter in optimal_combos_counters:
                print(f"Matching entry found for {cpu_name} with optimal combination.")
            else:
                print(f"No optimal combination matches the JSON entry for {cpu_name}.")
        else:
            print(f"CPU model {cpu_name} not found.")
    else:
        print(f"No JSON entry matches the pair: CPU {cpu_name}, Util {util}.")
