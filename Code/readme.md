## Description
This scripts automatically rebuilds the if-unofficial-models, copies them to if folder and runs the specified impl file. These are the following steps:
1. Rebuilds the if-unofficial-models project
2. Copies the unofficial models to the `node_modules` folder to the if project
3. Takes the impl file argument and checks if it exists
4. Runs the `impact-engine` on the selected impl and produces an ompl file (if/dev_models/)
5. Filters out all deprecations warnings

## First Run
Before running the actual script, you need run the build script. Simply run:
```
chmod +x build.sh
build.sh
```
This will install all models, dependencies, and fetch submodules from other repos.
Note: You only need to run this script one.

## Usage
Navigate to `code` folder, where both the if and if-unofficial-models are located, and run the following:
```
chmod +x run.sh
run.sh <impl_file>
```

Make sure to replace `"<impl_file>"` with impl file. For instance:
```
./run.sh metadata
```

An example output looks like the following:
```
$ ./run.sh metadata
[Rebuilding Models]
npm WARN using --force Recommended protections disabled.
yarn run v1.22.21
$ rm -rf build && tsc --project tsconfig.build.json
Done in 4.29s.
[Copying Models]
Done.
[Running Model]
--impl=dev_models/impls/metadata.yml
--ompl=dev_models/ompls/metadata_2024-01-20-T15-23-33.yml
yarn run v1.22.21
$ npx ts-node src/index.ts --impl dev_models/impls/metadata.yml --ompl dev_models/ompls/metadata_2024-01-20-T15-23-33.yml
[!important] Incubation Project
This project is an incubation project being run inside the Green Software Foundation; as such, we *DON’T recommend using it in any critical use case.
Incubation projects are experimental, offer no support guarantee, have minimal governance and process, and may be retired at any moment. This project may one day graduate, in which case this disclaimer will be removed.
[!important]
You are using models that are not part of the Impact Framework standard library. You should do your own research to ensure the models are up to date and accurate. They may not be actively maintained.
#configure()
{}
#execute()
[
  {
    timestamp: '2023-07-06T00:00',
    duration: 3600,
    'cloud-vendor': 'azure',
    'cloud-instance-type': 'Standard_NC24s_v3',
    'vcpus-allocated': '24',
    'vcpus-total': '28',
    'physical-processor': 'Intel Xeon E5-2690 v4',
    'memory-available': '448',
    'thermal-design-power': '135'
  }
]
Done in 7.11s.
[Output]
name: cloud-instance-metadata
description: simple demo invoking metadata lookup
tags: null
initialize:
  models:
    - name: cloud-instance-metadata
      path: '@grnsft/if-models'
      model: CloudInstanceMetadataModel
    - name: carbon-aware
      path: '@grnsft/if-unofficial-models'
      model: CarbonAwareModel
graph:
  children:
    child:
      pipeline:
        - cloud-instance-metadata
        - carbon-aware
      config:
        cloud-instance-metadata: null
      inputs:
        - timestamp: 2023-07-06T00:00
          duration: 3600
          cloud-vendor: azure
          cloud-instance-type: Standard_NC24s_v3
      outputs:
        - timestamp: 2023-07-06T00:00
          duration: 3600
          cloud-vendor: azure
          cloud-instance-type: Standard_NC24s_v3
          vcpus-allocated: '24'
          vcpus-total: '28'
          physical-processor: Intel Xeon E5-2690 v4
          memory-available: '448'
          thermal-design-power: '135'
Done.
```

## Output
The output contains a verbose output of all operations performed.
 46 changes: 46 additions & 0 deletions46  
Code/run.sh
@@ -0,0 +1,46 @@
#!/bin/bash

echo "[Rebuilding Models]"
cd if-unofficial-models
npm cache clean --force
yarn build

echo "[Copying Models]"
cd ../if
rm -rf node_modules/@grnsft/if-unofficial-models/build
# mkdir -p node_modules/@grnsft/if-unofficial-models
cp -r ../if-unofficial-models/build node_modules/@grnsft/if-unofficial-models
echo "Done."

# cp -r ../if-unofficial-models/ node_modules/@grnsft/if-unofficial-models

# Check if two arguments are provided (impl and ompl files)
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <impl_file>"
    exit 1
fi

current_datetime=$(date "+%Y-%m-%d-T%H-%M-%S")

# Assign the arguments to variables
impl_file="dev_models/impls/$1.yml"
ompl_file="dev_models/ompls/${1}_${current_datetime}.yml"

# Check if the input impl file exists
if [ ! -f "$impl_file" ]; then
    echo "Error: $impl_file does not exist."
    exit 1
fi

# Print the input string
echo "[Running Model]"
echo "--impl=$impl_file"
echo "--ompl=$ompl_file"

# Run the model
yarn impact-engine --impl "$impl_file" --ompl "$ompl_file" 2>&1 | grep -v 'DeprecationWarning' | grep -v 'warning'

echo "[Output]"
cat "$ompl_file" | grep -v 'DeprecationWarning' | grep -v 'Warning:'

printf "\nDone."