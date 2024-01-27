from datetime import datetime, timedelta
import itertools
import random

def calculate_subrange_allocation(timestamp_ranges, sampling):
    durations = []
    for range_str in timestamp_ranges:
        start_str, end_str = range_str.split(' - ')
        # Remove 'Z' and parse
        start = datetime.fromisoformat(start_str.rstrip('Z'))
        end = datetime.fromisoformat(end_str.rstrip('Z'))
        durations.append(end - start)
    total_duration = sum(durations, timedelta())
    allocations = [int(round(sampling * (duration / total_duration))) for duration in durations]
    
    # Adjust allocations to ensure the sum equals sampling
    while sum(allocations) > sampling:
        max_index = allocations.index(max(allocations))
        allocations[max_index] -= 1
    while sum(allocations) < sampling:
        min_index = allocations.index(min(allocations))
        allocations[min_index] += 1

    return allocations

def split_timestamp_ranges(timestamp_ranges, allocations):
    all_sub_ranges = []
    for (start_str, end_str), allocation in zip((range_str.split(' - ') for range_str in timestamp_ranges), allocations):
        # Remove 'Z' and parse
        start = datetime.fromisoformat(start_str.rstrip('Z'))
        end = datetime.fromisoformat(end_str.rstrip('Z'))
        sub_ranges = []
        for i in range(allocation):
            delta = (end - start) / allocation
            sub_start = start + delta * i
            sub_end = sub_start + delta
            # Append 'Z' to indicate UTC
            sub_ranges.append(f"{sub_start.isoformat()}Z - {sub_end.isoformat()}Z")
        all_sub_ranges.extend(sub_ranges)
    return all_sub_ranges

# Example usage in your main code block
sampling = 4  # Define your sampling variable based on your requirements
times = ["2023-11-02T10:35:31.820Z - 2023-11-02T11:35:31.820Z", "2023-11-03T12:46:31.820Z - 2023-11-03T19:25:31.820Z"]

allocations = calculate_subrange_allocation(times, sampling)
print(allocations)
all_sub_ranges = split_timestamp_ranges(times, allocations)
print(all_sub_ranges)

# Select an individual timestamp from each sub-range
individual_times = [sub_range.split(' - ')[0] for sub_range in all_sub_ranges]  # Selects the start of each sub-range
print(individual_times)

# Now, individual_times contains individual timestamps selected from the sub-ranges
