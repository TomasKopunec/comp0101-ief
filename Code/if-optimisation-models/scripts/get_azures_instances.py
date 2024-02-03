from azure.identity import DefaultAzureCredential
from azure.mgmt.compute import ComputeManagementClient
from azure.mgmt.subscription import SubscriptionClient
import json

# authenticate 
credential = DefaultAzureCredential()
subscription_id = 'your_subscription_id' 

compute_client = ComputeManagementClient(credential, subscription_id)
subscription_client = SubscriptionClient(credential)

# build a dictionary of VM series names (doing it once because it takes ages)
def build_vm_series_lookup():
    series_lookup = {}
    skus = compute_client.resource_skus.list()
    for sku in skus:
        series_lookup[sku.name] = sku.family
    return series_lookup

# fetch all Azure regions
def fetch_all_regions():
    regions = []
    for location in subscription_client.subscriptions.list_locations(subscription_id):
        regions.append(location.name)
    return regions

# fetch all vm types 
def fetch_and_organize_vm_sizes(series_lookup):
    series_data = {}
    total_instances = 0
    regions = fetch_all_regions()

    for region in regions:
        try:
            vm_sizes = compute_client.virtual_machine_sizes.list(location=region)
            for vm_size in vm_sizes:
                series_name = series_lookup.get(vm_size.name, "unknown series")
                if series_name not in series_data:
                    series_data[series_name] = []

                vm_instance = {
                    "model": vm_size.name,
                    "vCPUs": vm_size.number_of_cores,
                    "RAM": vm_size.memory_in_mb / 1024
                }

                if vm_instance not in series_data[series_name]:
                    series_data[series_name].append(vm_instance)
                    total_instances += 1
        except Exception as e:
            print(f"error processing region {region}: {e}")

    return series_data, total_instances

vm_series_lookup = build_vm_series_lookup()

vm_series_data, total_instances = fetch_and_organize_vm_sizes(vm_series_lookup)

# convert to JSON
vm_series_json = json.dumps(vm_series_data, indent=4)

# save the JSON to a file
filename = 'azure-instances.json'
with open(filename, 'w') as json_file:
    json_file.write(vm_series_json)

print(f"Total unique VM instances: {total_instances}")