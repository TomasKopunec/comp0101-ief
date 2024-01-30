# Emissions Data Analyzer

This script analyzes emissions data and visualizes the results in a bar graph. It takes input via the Impl filet, which specifies allowed timeframes, locations, and sampling size. The script then queries an API for the best and additional emissions data points within these parameters, ensuring unique values in the results.

## Features

- Parses input configurations from the impl file .
- Queries an API for emissions data based on the input parameters.
- Ensures uniqueness in the selected data points.
- Visualizes the results in a bar graph, saved to a file.

## Usage

1. Prepare a YAML file with the required parameters (`allowed-timeframes`, `allowed-locations`, and `sampling`). and add the shell model in the pipeline with the visualize script as the executable python script
2. Pipe the YAML content to the script via standard input and execute it:

3. The script will output the processed data and save a bar graph as `combinations_diagram.png` in the current directory.

## Requirements

- Python 3
- Required Python packages: `matplotlib`, `requests`, `yaml`

Ensure all dependencies are installed using pip:



