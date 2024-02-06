#!/bin/bash

# Set the source directory relative to the script location
python3 "create_combos.py" "enhanced.yml" "template.yml" # find all possible combos of regiosna nd times
source_dir="inputs"
rm -rf "outputs"
# Set the destination directory relative to the script location
dest_dir="outputs"

# Get the absolute path of the script
script_dir=$(dirname "$(readlink -f "$0")")

# Construct absolute paths for source and destination directories
source_dir="$script_dir/$source_dir"
dest_dir="$script_dir/$dest_dir"
echo $source_dir
#template.yaml is the input impl file
test_dir="$script_dir/template.yml"
cp $test_dir "../../../Code/if-optimisation-models/examples/"
cd "../../../Code/if-optimisation-models"
nvm use 18.17.1
npm install
npm run install2if:local
npm run if:local -- --impl examples/template.yml --ompl examples/run/template_ompl.yml
cp "examples/run/template_ompl.yml" "../../test_tool/carbon_advisor/exhaustive_rerun_method/template_ompl.yml"
rm "examples/run/template_ompl.yml"
rm "examples/template.yml"

# impact-engine  --impl $test_dir
# Iterate through each file in the source directory
for file in "$source_dir"/*; do
    echo $file
    # Check if it's a file
    if [ -f "$file" ]; then
        # Get the file name and directory name
        
        file_name=$(basename "$file")
        echo $file_name
        dest_file="$dest_dir/$file_name"
        echo $dest_file
        mkdir -p "examples/inputs"
        mkdir -p "examples/outputs"
        cp "../../test_tool/carbon_advisor/exhaustive_rerun_method/inputs/$file_name" "examples/inputs/$file_name"
        mkdir -p "$dest_dir"
        # Build the complete command
        #command="impact-engine --impl \"$file\" --ompl \"$dest_dir_name/$file_name\""
        #cp $file $dest_file
        npm run if:local -- --impl "examples/inputs/$file_name" --ompl "examples/outputs/$file_name"
        cp "examples/outputs/$file_name" "../../test_tool/carbon_advisor/exhaustive_rerun_method/outputs/$file_name"
        #impact-engine --impl "inputs/$file_name" --ompl "outputs/$file_name"
        # Execute the command
        #eval "$command"

        # Alternatively, you can uncomment the following line to just echo the command without executing it
        # echo "$command"
    fi
done
rm -rf "examples/inputs"
rm -rf "examples/outputs"

python3 "select_best.py"