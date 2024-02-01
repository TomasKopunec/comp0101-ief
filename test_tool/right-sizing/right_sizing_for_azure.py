import json
import yaml
from itertools import combinations

# Load CPU families data from a JSON file.
def load_cpu_families(cpu_data_file):
    with open(cpu_data_file, 'r') as file:
        return json.load(file)

# Find the family name of a given CPU model from the CPU families data.
def find_family_name(cpu_families, model_name):
    for family_name, models in cpu_families.items():
        if any(model['model'] == model_name for model in models):
            return family_name
    return None

# Find a specific CPU model within a CPU family.
def find_cpu_model(cpu_family, model_name):
    return next((model for model in cpu_family if model['model'] == model_name), None)

# Find all combinations of CPU models within a family that match or exceed a given number of effective vCPUs.
def find_combinations(cpu_family, effective_vCPUs):
    eligible_models = [model for model in cpu_family if model['vCPUs'] <= effective_vCPUs]
    eligible_models.sort(key=lambda x: x['vCPUs'], reverse=True)
    
    # Check for a single CPU model that matches the effective vCPUs
    single_model_match = next((model for model in eligible_models if model['vCPUs'] == effective_vCPUs), None)
    if single_model_match:
        return [single_model_match]
    
    # If no single model match, find combinations
    best_combination = None
    for r in range(1, len(eligible_models) + 1):
        for combo in combinations(eligible_models, r):
            total_vCPUs = sum(model['vCPUs'] for model in combo)
            if total_vCPUs >= effective_vCPUs:
                if not best_combination or sum(model['vCPUs'] for model in best_combination) > total_vCPUs:
                    best_combination = combo
    
    return best_combination if best_combination else []

# Calculate the new utilization rate based on the best combination of CPU models found.
def calculate_new_util(best_combination, effective_vCPUs):
    total_vCPUs = sum(model['vCPUs'] for model in best_combination)
    return effective_vCPUs / total_vCPUs if total_vCPUs > 0 else 0


# Calculate the new utilization and new CPUs based on the old CPU model, old utilization, and CPU data file.
def calculate_new_util_and_new_cpus(old_cpu, old_util, cpu_data_file):
    cpu_families = load_cpu_families(cpu_data_file)
    family_name = find_family_name(cpu_families, old_cpu)
    
    if not family_name:
        return f"CPU model '{old_cpu}' not found in any family."
    
    cpu_family = cpu_families.get(family_name)
    if not cpu_family:
        return f"CPU family '{family_name}' not found."
    
    old_cpu_model = find_cpu_model(cpu_family, old_cpu)
    if not old_cpu_model:
        return f"CPU model '{old_cpu}' not found in family '{family_name}'."
    
    effective_vCPUs = old_cpu_model['vCPUs'] * old_util
    best_combination = find_combinations(cpu_family, effective_vCPUs)
    
    if best_combination:
        new_util = round(calculate_new_util(best_combination, effective_vCPUs),3)
        return {
            "new_util": new_util,
            "new_cpus": [model['model'] for model in best_combination]
        }
    else:
        return "No suitable right-sized model found."

# Process the configuration file, calculate new CPU utilizations and models for each input.
def process_config_file(config_file):
    with open(config_file, 'r') as file:
        config_data = yaml.safe_load(file)

    cpu_data_file = config_data['graph']['children']['child']['config']['right-sizing']['data-path']
    inputs = config_data['graph']['children']['child']['inputs']

    results = []
    for input_data in inputs:
        # print("Current input data:", input_data)
        cloud_instance_type = input_data['cloud-instance-type']
        cpu_util = input_data['cpu-util']
        result = calculate_new_util_and_new_cpus(cloud_instance_type, cpu_util, cpu_data_file)
        results.append(result)
    
    return results, inputs


# Format the results for output, pairing the old CPU and utilization with the new calculated values.
def output_results(results, inputs):
    formatted_results = []
    for result, input_data in zip(results, inputs):
        formatted_result = {
            "old_cpu": input_data['cloud-instance-type'],
            "old_util": input_data['cpu-util'],
            "new_util": result['new_util'] if 'new_util' in result else None,
            "new_cpus": result['new_cpus'] if 'new_cpus' in result else None
        }
        formatted_results.append(formatted_result)
    return formatted_results