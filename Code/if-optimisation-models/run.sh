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
echo "--manifest=$impl_file"
echo "--output=$ompl_file"

# Run the local model
if [ $option = "local" ]; then
    echo "[Running in Local Mode]"
    npm run install-and-exec:local -- --manifest "${impl_file}" --output "${ompl_file}" 2>&1 | grep -v 'DeprecationWarning' | grep -v 'warning'
elif [ $option = "dev" ]; then
    echo "[Running in Dev Mode]"
    cp -r ./data ../if/
    cp -r ./examples ../if/
    npm run install-and-exec:dev -- --manifest "${impl_file}" --output "../if-optimisation-models/${ompl_file}"
elif [ $option = "dev-no-install" ]; then
    echo "[Running in Dev (No Install) Mode]"
    cp -r ./data ../if/
    cp -r ./examples ../if/
    npm run build
    npm run if:dev -- --manifest "${impl_file}" --output "../if-optimisation-models/${ompl_file}"
else
    echo "please input one of the following options for parameter <option>: local/dev."
fi

echo "[Output]"
# if [ $option = "local" ]; then
cat "$ompl_file" | grep -v 'DeprecationWarning' | grep -v 'Warning:'
# elif [ $option = "dev" ] || [ $option = "dev-no-install" ]; then
#     cat "../if/$ompl_file" | grep -v 'DeprecationWarning' | grep -v 'Warning:'
# fi

echo "[The output is saved in $ompl_file]"
printf "Done\n"