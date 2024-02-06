# Rightsizing Model

## Overview

The right-sizing model for Impact Engine Framework is designed to identify cloud computing instances that better align with the performance and capacity requirements of the customer's workload, with the goal of achieving the lowest possible cost. It takes input in `yaml` format, ultimately providing more optimal instances based on the current cloud instance type, cloud vendor, current CPU utilization, target CPU utilization, and RAM requirements. Currently, this model primarily targets virtual machines of Azure and AWS.

## Usage

This model is used in Impact Engine Framework pipeline following models such as `azure-importer` , which provides essential information like the CPU utilization of the current Azure virtual machine. It is typically followed by data-enrichment models like `carbon advisor model`  or `plotter model` . If you are using an AWS virtual machine, you will need to manually input the current CPU utilization in the input `yaml` . This model accepts multiple cloud instances in one input `yaml`.

## Key Features

- Searching for potential replacement instances
    - We organized two datasets that categorize instances based on their family, where instances within the same family share similar hardware configurations or use scenarios.
    - Upon receiving the input instance type, it identifies other instances with different configurations within the same family from the dataset.
- Calculating the right-sizing and providing recommendations.
    - Calculate the optimal combination of instances to meet the required vCPUs based on the input CPU utilization, while satisfying the current memory requirements.
    - Provide recommendations for instances to increase CPU utilization.

## Configuration

Required parameters:

- `cloud-vendor` : Virtual machines provider. Currently accepts `azure` and `aws`.
- `cloud-instance-type` : The name of the current cloud instance. Refer to the following example or explore more instances: `Code/if-optimisation-models/data`.
- `cpu-util` : The percentage CPU utilization of the current virtual machines.

Optional parameter:

- `target-cpu-util` : Default is 100.

## Outputs

- For each instance in the input YAML, suggest at least one replacement instance, and a maximum of three, that enhance the CPU utilization percentage while aligning with memory usage.
- If there are no instances that optimize CPU utilization, return the original instance and give it recommendation: **`SAME as the old instance`**.

Outputs yaml:

- `cloud-instance-type` : The name of the suggest replacement cloud instance.
- `cpu-util`: The percentage CPU utilization after changing to the replacement cloud instance.
- `old-instance`: The name of the original cloud instance.
- `old-cpu-util`: Percentage CPU utilization of the original cloud instance.

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
          target-cpu-util: 75
          mem-availableGB: 0.488636416
          mem-usedGB: 0.5113635839999999
          total-memoryGB: 1
          mem-util: 51.13635839999999
          location: uksouth
          cloud-instance-type: 'B16ps_v2'
        - timestamp: '2023-11-02T10:35:00.000Z'
          duration: 300
          cloud-vendor: azure
          cpu-util: 50
          target-cpu-util: 80
          mem-availableGB: 0.488636416
          mem-usedGB: 0.5113635839999999
          total-memoryGB: 1
          mem-util: 51.13635839999999
          location: uksouth
          cloud-instance-type: 'F64s_v2'
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
          target-cpu-util: 75
          mem-availableGB: 0.488636416
          mem-usedGB: 0.5113635839999999
          total-memoryGB: 1
          mem-util: 51.13635839999999
          location: uksouth
          cloud-instance-type: B16ps_v2
        - timestamp: '2023-11-02T10:35:00.000Z'
          duration: 300
          cloud-vendor: azure
          cpu-util: 50
          target-cpu-util: 80
          mem-availableGB: 0.488636416
          mem-usedGB: 0.5113635839999999
          total-memoryGB: 1
          mem-util: 51.13635839999999
          location: uksouth
          cloud-instance-type: F64s_v2
      outputs:
        - timestamp: '2023-11-02T10:35:00.000Z'
          duration: 300
          cloud-vendor: azure
          cpu-util: 75
          target-cpu-util: 75
          mem-availableGB: 0.488636416
          mem-usedGB: 0.5113635839999999
          total-memoryGB: 1
          mem-util: 51.13635839999999
          location: uksouth
          cloud-instance-type: B8pls_v2
          data-path: data/azure-instances.json
          old-instance: B16ps_v2
          old-cpu-util: 50
        - timestamp: '2023-11-02T10:35:00.000Z'
          duration: 300
          cloud-vendor: azure
          cpu-util: 50
          target-cpu-util: 75
          mem-availableGB: 0.488636416
          mem-usedGB: 0.5113635839999999
          total-memoryGB: 1
          mem-util: 51.13635839999999
          location: uksouth
          cloud-instance-type: B4pls_v2
          data-path: data/azure-instances.json
          old-instance: B16ps_v2
          old-cpu-util: 50
        - timestamp: '2023-11-02T10:35:00.000Z'
          duration: 300
          cloud-vendor: azure
          cpu-util: 75
          target-cpu-util: 75
          mem-availableGB: 0.488636416
          mem-usedGB: 0.5113635839999999
          total-memoryGB: 1
          mem-util: 51.13635839999999
          location: uksouth
          cloud-instance-type: B16ps_v2
          data-path: data/azure-instances.json
          old-instance: B16ps_v2
          old-cpu-util: 50
          recommendation: SAME as the old instance
        - timestamp: '2023-11-02T10:35:00.000Z'
          duration: 300
          cloud-vendor: azure
          cpu-util: 80
          target-cpu-util: 80
          mem-availableGB: 0.488636416
          mem-usedGB: 0.5113635839999999
          total-memoryGB: 1
          mem-util: 51.13635839999999
          location: uksouth
          cloud-instance-type: F32s_v2
          data-path: data/azure-instances.json
          old-instance: F64s_v2
          old-cpu-util: 50
        - timestamp: '2023-11-02T10:35:00.000Z'
          duration: 300
          cloud-vendor: azure
          cpu-util: 80
          target-cpu-util: 80
          mem-availableGB: 0.488636416
          mem-usedGB: 0.5113635839999999
          total-memoryGB: 1
          mem-util: 51.13635839999999
          location: uksouth
          cloud-instance-type: F8s_v2
          data-path: data/azure-instances.json
          old-instance: F64s_v2
          old-cpu-util: 50
        - timestamp: '2023-11-02T10:35:00.000Z'
          duration: 300
          cloud-vendor: azure
          cpu-util: 80
          target-cpu-util: 80
          mem-availableGB: 0.488636416
          mem-usedGB: 0.5113635839999999
          total-memoryGB: 1
          mem-util: 51.13635839999999
          location: uksouth
          cloud-instance-type: F72s_v2
          data-path: data/azure-instances.json
          old-instance: F64s_v2
          old-cpu-util: 50
```

## Contributing

Contributions to enhance the Rightsizing model, such as adding more instance types or improving the input/output handling, are welcome. Please submit pull requests with your proposed changes.