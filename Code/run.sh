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