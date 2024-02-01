#!/bin/sh

# Check if two arguments are provided (impl and ompl files)
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <impl_file>"
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
# npm run if:local -- --impl "$impl_file" --ompl "$ompl_file" 2>&1 | grep -v 'DeprecationWarning' | grep -v 'warning'
npm run install-and-exec:local -- --impl "$impl_file" --ompl "$ompl_file" 2>&1 | grep -v 'DeprecationWarning' | grep -v 'warning'

echo "[Output]"
cat "$ompl_file" | grep -v 'DeprecationWarning' | grep -v 'Warning:'

echo "[The output is saved in $ompl_file]"
printf "Done\n"