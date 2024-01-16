## Run the Script

1. **Open the Script:**
   - Use a text editor to open the script (`overhead.sh`).
   - Modify the `command_1` and `command_2` variables to your desired commands.
     - Currently, both commands are `impact-engine` executions; you can change the `impl` on each command.

2. **Set the Number of Runs:**
   - Inside the script, find and set the `num_runs` variable to the desired number of runs.

3. **Execute the Script:**
   - Run the script in your terminal:
     ```bash
     ./overhead.sh
     ```
   - If the bash script has no execute privileges, run:
     ```bash
     chmod +x overhead.sh
     ```
   - If needed, change the npm version by running:
     ```bash
     nvm use 18.17.1
     ```

After executing the script, it will display the average time taken for each command, the time difference of averages, and the percentage change.

## Script Explanation

### `calculate_time_difference()`
This function takes two timestamp values and calculates the time difference in milliseconds.

### `calculate_total_time_difference()`
This function takes two timestamp values in milliseconds and calculates the time difference in milliseconds.

### `calculate_percentage_change()`
This function calculates the percentage change between two values, considering the possibility of division by zero.

### `run_command_multiple_times()`
This function runs a given command multiple times, measures the execution time, and calculates the average time.

### Main Execution
1. **Output Redirection:**
   - Output redirection is set up by creating an empty `output.txt` file.

2. **Define Commands:**
   - Two commands (`command_1` and `command_2`) are defined. These can be modified according to your use case.

3. **Run Commands:**
   - The script runs both commands multiple times using the `run_command_multiple_times()` function.

4. **Calculate Averages:**
   - Average times are calculated for each command.

5. **Calculate Time Difference and Percentage Change:**
   - Time difference and percentage change are calculated.

6. **Display Results:**
   - The results are displayed in the console.
