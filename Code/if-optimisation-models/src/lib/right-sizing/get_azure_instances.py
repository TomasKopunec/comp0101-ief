from azure.identity import DefaultAzureCredential
from azure.mgmt.compute import ComputeManagementClient
from azure.mgmt.subscription import SubscriptionClient
import json
import requests

# authenticate 
credential = DefaultAzureCredential()
subscription_id = '' 

compute_client = ComputeManagementClient(credential, subscription_id)
subscription_client = SubscriptionClient(credential)

def fetch_price_for_vm(sku, region):
    api_url = "https://prices.azure.com/api/retail/prices?api-version=2021-10-01-preview"
    query = f"armRegionName eq '{region}' and armSkuName eq '{sku}' and priceType eq 'Consumption'"
    response = requests.get(api_url, params={'$filter': query})
    json_data = json.loads(response.text)
    
    if 'Items' in json_data and len(json_data['Items']) > 0:
        # Get pay as you go pricing 
        return json_data['Items'][0]['retailPrice']
    else:
        return "Not available"

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

                # initialize or update the VM instance in the series data
                existing_instance = next((item for item in series_data[series_name] if item["model"] == vm_size.name), None)
                if existing_instance:
                    # update the price info with the new region's pricing
                    existing_instance["Price"][region] = fetch_price_for_vm(vm_size.name, region)
                else:
                    # areate a new VM instance entry
                    vm_instance = {
                        "model": vm_size.name,
                        "vCPUs": vm_size.number_of_cores,
                        "RAM": vm_size.memory_in_mb / 1024,
                        "Price": {region: fetch_price_for_vm(vm_size.name, region)}  
                    }
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