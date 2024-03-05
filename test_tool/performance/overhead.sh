#!/bin/bash

if [ "$#" -eq 2 ]; then
    file1="$1"
    file2="$2"
else
    echo "Usage: $0 <impl_file1> <imple_file2>"
    exit 1
fi

# Function to calculate time difference in milliseconds
calculate_time_difference() {
    local start_time=$1
    local end_time=$2

    local diff_nanoseconds=$((end_time - start_time))
    local diff_milliseconds=$((diff_nanoseconds / 1000000))  # Convert nanoseconds to milliseconds
    echo $diff_milliseconds
}
calculate_total_time_difference() {
    local start_time=$1
    local end_time=$2

    local diff=$((end_time - start_time))
    echo $diff
}


# Function to calculate percentage increase or decrease
calculate_percentage_change() {
    local old_value=$1
    local new_value=$2

    local percentage_change=$(( (new_value - old_value) * 100 / (old_value == 0 ? 1 : old_value) ))
    echo $percentage_change
}

# Function to run a command multiple times and calculate the average time
run_command_multiple_times() {
    local command=$1
    local num_runs=$2

    local total_time=0
    

    for ((i=1; i<=$num_runs; i++)); do
        
        start_time=$(date +%s%N)
        { eval "$command" >> $output_file 2>&1; } 
        end_time=$(date +%s%N)

        total_time=$((total_time + $(calculate_time_difference $start_time $end_time)))
        sleep 10
    done

    local average_time=$((total_time / num_runs))
    echo $average_time
}
output_file="output.txt"

    # Redirect output to a file
echo "" > $output_file
# Set the number of runs for each command
num_runs=10
cd ../../Code/if-optimisation-models
# Command 1 test_tool/performance/overhead.sh
command_1="./run.sh $file1"
average_time_1=$(run_command_multiple_times "$command_1" $num_runs)

# Command 2
command_2="./run.sh $file2"
average_time_2=$(run_command_multiple_times "$command_2" $num_runs)

# Calculate time differences
# Calculate time differences
time_difference_1_2=$(($(calculate_total_time_difference $average_time_1 $average_time_2)))


# Calculate percentage change
percentage_change=$(calculate_percentage_change $average_time_1 $average_time_2)

# Display results
echo "Average time taken for command 1: ${average_time_1} milliseconds"
echo "Average time taken for command 2: ${average_time_2} milliseconds"
echo "Time difference of averages: ${time_difference_1_2} milliseconds"
echo "Percentage change: ${percentage_change}%"
