#!/bin/bash

# Set the source directory relative to the script location
python3 "create_combos.py"
source_dir="inputs"

# Set the destination directory relative to the script location
dest_dir="outputs"

# Get the absolute path of the script
script_dir=$(dirname "$(readlink -f "$0")")

# Construct absolute paths for source and destination directories
source_dir="$script_dir/$source_dir"
dest_dir="$script_dir/$dest_dir"
echo $source_dir
test_dir="$script_dir/template.yaml"

impact-engine  --impl $test_dir
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
        
        mkdir -p "$dest_dir"
        # Build the complete command
        #command="impact-engine --impl \"$file\" --ompl \"$dest_dir_name/$file_name\""
        #cp $file $dest_file
        impact-engine --impl "inputs/$file_name" --ompl "outputs/$file_name"
        # Execute the command
        #eval "$command"

        # Alternatively, you can uncomment the following line to just echo the command without executing it
        # echo "$command"
    fi
done

python3 "select_best.py"