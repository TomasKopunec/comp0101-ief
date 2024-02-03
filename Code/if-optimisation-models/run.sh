#!/bin/sh

# Check if two arguments are provided (impl and ompl files)
if [ "$#" -eq 2 ]; then
    option="$2"
elif [ "$#" -eq 1 ]; then
    option="local"
else
    echo "Usage: $0 <impl_file> <options>"
    exit 1
fi

current_datetime=$(date "+%Y-%m-%d-T%H-%M-%S")

# Assign the arguments to variables
impl_file="examples/$1.yml"
ompl_file="results/${1}_${current_datetime}.yml"

# Check if the input impl file exists
if [ ! -f "$impl_file" ]; then
    echo "Error: $impl_file does not exist."
    exit 1
fi

# Print the input string
echo "[Running Local Model]"
echo "--impl=$impl_file"
echo "--ompl=$ompl_file"

# Run the local model
if [ $option = "local" ]; then
    npm run install-and-exec:local -- --impl "./${impl_file}" --ompl "./${ompl_file}" 2>&1 | grep -v 'DeprecationWarning' | grep -v 'warning'
elif [ $option = "dev" ]; then
    cp -r ./data ../if/
    npm run install-and-exec:dev -- --impl "../if-optimisation-models/${impl_file}" --ompl "../if-optimisation-models/${ompl_file}" 2>&1 | grep -v 'DeprecationWarning' | grep -v 'warning'
else
    echo "please input one of the following options for parameter <option>: local/dev."
fi

echo "[Output]"
cat "$ompl_file" | grep -v 'DeprecationWarning' | grep -v 'Warning:'

echo "[The output is saved in $ompl_file]"
printf "Done\n"