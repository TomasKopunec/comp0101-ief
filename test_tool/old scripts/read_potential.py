import yaml
from datetime import datetime, timedelta
from itertools import product

def parse_timestamp(timestamp):
    if ' - ' in timestamp:
        parts = map(str.strip, timestamp.split(' - ' ))
        
        start, end = parts
        start_time = datetime.strptime(start, '%Y-%m-%dT%H:%M')
        end_time = datetime.strptime(end, '%Y-%m-%dT%H:%M')
        current_time = start_time

        while current_time <= end_time:
            yield current_time.strftime('%Y-%m-%dT%H:%M')
            current_time += timedelta(hours=1)
    
    else:
        yield timestamp

def read_yaml_file(file_path):
    with open(file_path, 'r') as file:
        data = yaml.safe_load(file)
        timestamps_lists = data.get('timestamps', [])

    result = []
    for timestamps in timestamps_lists:
        temp_list = []
        for timestamp in timestamps:
            temp_list.extend(parse_timestamp(timestamp))
        result.append(temp_list)

    return result

def generate_combinations(timestamps_lists):
    return list(product(*timestamps_lists))
# Example usage
file_path = 'multiple_timestamps.yaml'

timestamps_lists = read_yaml_file(file_path)
print(timestamps_lists)
combinations = generate_combinations(timestamps_lists)
print(combinations)
