# Rightsizing Model

## Overview

The right-sizing model for Impact Engine Framework is designed to identify cloud computing instances that better align with the performance and capacity requirements of the customer's workload, with the goal of achieving the lowest possible cost. It takes input in `yaml` format, ultimately providing more optimal instances based on the current cloud instance type, cloud vendor, current CPU utilization, target CPU utilization, and RAM requirements. Currently, this model primarily targets virtual machines of Azure and AWS.

## Usage

This model is used in Impact Engine Framework pipeline following models such as `azure-importer` , which provides essential information like the CPU utilization of the current Azure virtual machine. It is typically followed by data-enrichment models like `carbon advisor model`  or `plotter model` . If you are using an AWS virtual machine, you will need to manually input the current CPU utilization in the input `yaml` . This model accepts multiple cloud instances in one input `yaml`.

## Key Features

- Searching for potential replacement instances
    - We have organized two datasets containing information about vCPU, RAM size, and prices of instance obtained from the Azure and AWS APIs. The datasets classify instances based on their families, where 'family' refers to instances with similar hardware configurations or use scenarios. (See the following example)
    - The optimization process for instances is conducted based on instances within the same family. This ensures that instances sharing similar hardware configurations or use scenarios are taken into account. Substituting instances with varying CPUs and RAM within the same family enhances the precision of optimization estimations and reduces potential system issues.
    
- Calculating the right-sizing and providing recommendations.
    - Based on the CPU utilization, memory utilization, RAM size, price, and price difference percentage, return an array containing the optimal combination of cloud instances.
    - Core algorithm:
      1. Identify all instance combinations with sufficient CPU and RAM.
      2. Filter out the optimal CPU combinations under sufficient RAM conditions (CPU utilization closest to the target utilization).
      3. In case of multiple results, further filter the optimal combinations based on RAM (identify the combination that meets the requirements with the minimum RAM).
      4. In case of multiple results, select the combination with the lowest price based on the instance prices.
### Example of Identifying Instances Within the Same Family
Based on the following section of the dataset, if the input YAML specifies `Standard_D2a_v4` as the instance type name, the model conducts optimization by identifying potential combination instances within the same family ( `StandardDAv4Family`). This family includes instances such as `Standard_D4a_v4`, `Standard_D8a_v4`, `Standard_D16a_v4`, ..., `Standard_D96a_v4`, all of which share similar hardware configurations or use scenarios.
```json
    "standardDAv4Family": [
        {
            "model": "Standard_D2a_v4",
            "vCPUs": 2,
            "RAM": 8.0,
            "Price": {...}
        },
        {
            "model": "Standard_D4a_v4",
            "vCPUs": 4,
            "RAM": 16.0,
            "Price": {...}
        },
        {
            "model": "Standard_D8a_v4",
            "vCPUs": 8,
            "RAM": 32.0,
            "Price": {...}
        },
        {
            "model": "Standard_D16a_v4",
            "vCPUs": 16,
            "RAM": 64.0,
            "Price": {...}
        },
        ...
        {
            "model": "Standard_D96a_v4",
            "vCPUs": 96,
            "RAM": 384.0,
            "Price": {...}
        }
    ],
```
## Configuration

Required parameters:

- `cloud-vendor` : Virtual machines provider. Currently accepts `azure` and `aws`.
- `cloud-instance-type` : The name of the current cloud instance. Refer to the following example or explore more instances: `Code/if-optimisation-models/data`.
- `cpu-util` : The percentage CPU utilization of the current virtual machines.
- `mem-util` : The percentage RAM utilization of the current virtual machines.

Optional parameter:

- `target-cpu-util` : Default is 100.

## Outputs

- For each instance in the input YAML, suggest the optimal combination of replacement instances that enhance the CPU utilization percentage while aligning with memory usage.
- If there are no instances that optimize CPU utilization, return the original instance and give it recommendation: **`SAME as the old instance`**.

Outputs yaml:

- `cloud-instance-type` : The name of the suggest replacement cloud instance.
- `cpu-util` : The percentage CPU utilization after changing to the replacement cloud instances.
- `old-instance` : The name of the original cloud instance.
- `old-cpu-util` : Percentage CPU utilization of the original cloud instance.
- `old-mem-util` : Percentage RAM utilization of the original cloud instance.
- `price-change` : The increase or decrease in price after switching to the replacement cloud instances.
- `output-id` : With the same ID means that they are in the same recommended combination of instances.

## Simple Example Impl and corresponding Ompl

`Impl` :

```yaml
name: low-cpu-util
description: example config file for low cpu utility
tags: null
initialize:
  models:
    - name: right-sizing-target
      model: RightSizingModel
      path: "@grnsft/if-optimisation-models"
graph:
  children:
    child:
      pipeline:
        - right-sizing-target
      config:
        right-sizing-target:
          data-path: 'data/azure-instances.json'
      inputs:
        - timestamp: '2023-11-02T10:35:00.000Z'
          duration: 300
          cloud-vendor: azure
          cpu-util: 50
          target-cpu-util: 100
          mem-availableGB: 0.488636416
          mem-usedGB: 0.5113635839999999
          total-memoryGB: 32 
          mem-util: 50
          location: westus
          cloud-instance-type: 'Standard_D8a_v4'
```

`Ompl`:

```yaml
name: low-cpu-util
description: example config file for low cpu utility
tags: null
initialize:
  models:
    - name: right-sizing-target
      path: '@grnsft/if-optimisation-models'
      model: RightSizingModel
graph:
  children:
    child:
      pipeline:
        - right-sizing-target
      config:
        right-sizing-target:
          data-path: data/azure-instances.json
      inputs:
        - timestamp: '2023-11-02T10:35:00.000Z'
          duration: 300
          cloud-vendor: azure
          cpu-util: 50
          target-cpu-util: 100
          mem-availableGB: 0.488636416
          mem-usedGB: 0.5113635839999999
          total-memoryGB: 32
          mem-util: 50
          location: westus
          cloud-instance-type: Standard_D8a_v4
      outputs:
        - timestamp: '2023-11-02T10:35:00.000Z'
          duration: 300
          cloud-vendor: azure
          cpu-util: 100
          target-cpu-util: 100
          mem-availableGB: 0.488636416
          mem-usedGB: 0.5113635839999999
          total-memoryGB: 16
          mem-util: 100
          location: westus
          cloud-instance-type: Standard_D4a_v4
          data-path: data/azure-instances.json
          old-instance: Standard_D8a_v4
          old-cpu-util: 50
          old-mem-util: 50
          price-change: Price decreased by 98%
```

## Contributing

Contributions to enhance the Rightsizing model, such as adding more instance types or improving the input/output handling, are welcome. Please submit pull requests with your proposed changes.