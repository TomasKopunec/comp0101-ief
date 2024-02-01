import csv
import yaml

# Collect timestamps from the current node's outputs.
def collect_timestamps(node, timestamps):
    for output in node.get('outputs', []):
        timestamp = format_timestamp(output['timestamp'])
        timestamps.add(timestamp)

    # Recursively collect timestamps from children.
    for child in node.get('children', {}).values():
        collect_timestamps(child, timestamps)

# Format the timestamp to include date and time up to minutes.
 # Convert from 'YYYY-MM-DDTHH:MM' to 'YYYY-MM-DD-HH:MM'.
def format_timestamp(timestamp):
    parts = timestamp.replace('T', '-').replace(':', '-').split('-')
    formatted_timestamp = f"{parts[0]}-{parts[1]}-{parts[2]}-{parts[3]}:{parts[4]}"
    return formatted_timestamp

# Process the current node.
def process_node(path, node, csv_data, timestamps):
    if 'aggregated' in node:
        row = [path + '.carbon', node['aggregated']['carbon']]
        timestamp_values = {format_timestamp(output['timestamp']): output['carbon'] for output in node.get('outputs', [])}
        for ts in sorted(timestamps):
            row.append(timestamp_values.get(ts, 0))
        csv_data.append(row)

    # Recursively process children.
    for key, child in node.get('children', {}).items():
        process_node(f"{path}.children.{key}", child, csv_data, timestamps)

# Read YAML file and return data.
def read_yaml(file_path):
    with open(file_path, 'r') as file:
        return yaml.safe_load(file)

# Write data to CSV file.
def write_csv(file_path, csv_data, timestamps):
    with open(file_path, 'w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['Path', 'Aggregated'] + sorted(timestamps))
        writer.writerows(csv_data)

def main():
    input_file_path = 'test_input.yml'
    output_file_path = 'output.csv'
    
    data = read_yaml(input_file_path)
    csv_data = []
    timestamps = set()
    
    collect_timestamps(data['graph'], timestamps)
    process_node('graph', data['graph'], csv_data, sorted(timestamps))
    write_csv(output_file_path, csv_data, sorted(timestamps))

if __name__ == "__main__":
    main()
