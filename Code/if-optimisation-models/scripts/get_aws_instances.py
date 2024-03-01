import pandas as pd
import os
import json
import boto3

# Function to fetch prices for all instances
def fetch_price_data():
  region_files_path = [f for f in os.listdir('../data/aws-all-price')]
  columns = ['type', 'price', 'vCPU', 'memory', 'storage', 'network']

  for filename in region_files_path:
    df = pd.read_csv('../data/aws-all-price/' + filename, sep='\t', header=None, names=columns)
    for index, row in df.iterrows():
      instance = row['type']
      price_str = row['price']
      if price_str is not None:
        price = float(price_str.replace('$', ''))
        region = os.path.splitext(filename)[0]
        if instance not in price_data:
          price_data[instance] = {'Price': {}}
        price_data[instance]['Price'][region] = float(price)

# Function to sort instances by type name
def sort_by_type_name(e):
  return e['model']

# Function to fetch all instances and arrange them by family
def fetch_all_instances_arranged_by_family():
  ec2_client = boto3.client('ec2')
  response = ec2_client.describe_instance_types()

  instance_types_info = []
  while 'NextToken' in response:
    for instance_type in response['InstanceTypes']:
      type_name = instance_type['InstanceType']
      vCPU_num = instance_type['VCpuInfo']['DefaultVCpus']
      RAM_GiB = instance_type['MemoryInfo']['SizeInMiB'] / 1024
      instance_type_info = {'model': type_name, 'vCPUs': vCPU_num, 'RAM': RAM_GiB}
      instance_types_info.append(instance_type_info)
    response = ec2_client.describe_instance_types(NextToken=response['NextToken'])

  instance_types_info.sort(key=sort_by_type_name)

  arranged_by_family['high memory'] = []
  for instance in instance_types_info:
    model = instance['model'].split('.')[0]
    if model.startswith('u-'):
      arranged_by_family['high memory'].append(instance)
    else:
      found_family = False
      for family, value in arranged_by_family.items():
        try1 = family + 'd'
        try2 = family[:-1] + 'd' + family[-1:]
        if try1 == model or try2 == model or family == model:
          arranged_by_family[family].append(instance)
          found_family = True
          break
      if not found_family:
        arranged_by_family[model] = [instance]

# Function to join prices with instance information
def join_price_with_info():
  for family, instances in arranged_by_family.items():
    for instance in instances:
      model = instance['model']
      if model in price_data:
        instance['Price'] = price_data[model]['Price']

# Initialize variables
arranged_by_family = {}
price_data = {}

fetch_all_instances_arranged_by_family()
fetch_price_data()
join_price_with_info()

with open('aws-instances.json', 'w') as json_file:
  json.dump(arranged_by_family, json_file, indent=2)
