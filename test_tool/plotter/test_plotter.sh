#!/bin/bash

if [ "$#" -eq 2 ]; then
    file1="$1"
    file2="$2"
else
    echo "Usage: $0 <impl_file> <yaml file for testing>"
    exit 1
fi
command2="python3 test_plotter.py $file2"
{ eval "$command2";  } 
cd ../../Code/if-optimisation-models

# Command 1 test_tool/performance/overhead.sh
./run.sh "$file1"
 
