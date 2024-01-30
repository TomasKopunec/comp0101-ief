# Carbon Emissions Analyzer

This Python script analyzes carbon emissions data by interacting with a specified API, processing input configurations from a YAML file, and outputting the optimal results back into a modified YAML file.

## Features

- Fetches the best timeframes and locations for carbon emissions based on provided configurations.
- Parses input configurations from a YAML file.
- Determines the best results based on the lowest carbon emission ratings.
- Outputs the results into a modified YAML file, appending "ompl" before the file extension of the input file.

## Requirements

- Python 3.x
- `requests` library for making API calls
- `yaml` library for parsing and generating YAML files

## Usage

1. Ensure you have Python 3.x installed along with the required libraries.
2. Prepare your input YAML file with the necessary configurations.
3. Run the script from the command line, providing the path to the input YAML file as an argument:


For example, if your input file is named `config.yml`, you would run:


4. The script will process the input file and output the results into a new file with the same name as the input file, but with "ompl" appended before the file extension. For the above example, the output file would be named `configompl.yml`.

## Input File Format

The input YAML file should contain configurations for allowed locations and timeframes for the carbon emissions analysis. Here is an example format:

```yaml
allowed-locations:
- northeurope
- eastus
- westus
allowed-timeframes:
- '2022-07-19T14:00:00Z - 2022-07-31T19:00:00Z'
```

## Output File

The output file will be named as the input + _ompl and will contain the same information as the input file with an additional section named output, listing the best results based on the lowest carbon emission ratings.