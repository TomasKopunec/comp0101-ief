# Tester script fot the right sizing model 

This Python script is designed to read CPU utilization and instance types from the impl file, find optimal combinations of new CPU instances based on the utilization increase, and compare these combinations against a predefined JSON dataset to validate the optimization.The Json must be changed depending on the resul;ts we got from the right sizing model.

## Prerequisites

- Python 3.x
- `yaml` Python package
- `json` Python package
- AWS and Azure JSON instance files
- Input YAML file containing CPU utilization and instance types

## Usage

1. Ensure you have Python 3 installed on your system.
2. Install the `yaml` package if not already installed:

   ```
   pip install pyyaml
   ```

3. The AWS and Azure JSON instance files with the required format are ready.
4. Bring the Impl Yaml file you used for the righsizing model in this directory
5. Create the Json results.json based on the ompl file produced by the impact engine.
6. Run the script using the following command, replacing `<yaml_file_path>` with the path to your input YAML file:

   ```
   python script.py <yaml_file_path>
   ```

The script will read the input YAML file, extract CPU utilization and instance types, and then find optimal combinations of new CPU instances that match or exceed the required utilization. It will compare these combinations against the JSON file (`results.json`) to validate if the optimization matches any pof the ones produced by thee ief.



## Output

The script prints the optimal combinations found, the total vCPUs for each combination, and whether these combinations match any entries in the `results.json` file.

