import csv
from datetime import datetime, timedelta

def read_csv_and_find_rating(file_path, location_input, time_input):
    # Convert the input time string to a datetime object, assuming it is offset-naive
    time_input_dt = datetime.fromisoformat(time_input)
    
    with open(file_path, mode='r', newline='') as file:
        csv_reader = csv.DictReader(file)
        
        for row in csv_reader:
            if row['location'] == location_input:
                # Convert the row's time to a datetime object and remove timezone information
                row_time_naive = datetime.fromisoformat(row['time']).replace(tzinfo=None)
                duration_hours, duration_minutes, duration_seconds = map(int, row['duration'].split(':'))
                row_duration = timedelta(hours=duration_hours, minutes=duration_minutes, seconds=duration_seconds)
                
                if row_time_naive <= time_input_dt < (row_time_naive + row_duration):
                    time_period = f"{row['time']} to {(row_time_naive + row_duration).isoformat()}"
                    return row['rating'], row['duration'], time_period, row['location']
    
    return None, None, None, None 


file_path = 'emissions_data_211117_221116.csv'
location_input = 'westus'
time_input = '2021-12-17T05:35:00'
rating, duration, time_period, location = read_csv_and_find_rating(file_path, location_input, time_input)

if rating:
    print(f"Rating: {rating}, Duration: {duration}, Time Period: {time_period}, Location: {location}")
else:
    print("No matching record found")