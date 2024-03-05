import requests
import unittest
import json
import os
import time
import random
from datetime import datetime, timedelta


def generate_random_datetime_at_hour_end(start_date, end_date):
    """
    Generate a random datetime between start_date and end_date, ensuring it's at the end of an hour.
    """
    time_difference = end_date - start_date
    random_seconds = random.randint(0, int(time_difference.total_seconds()))
    random_date = start_date + timedelta(seconds=random_seconds)
    # Set minutes and seconds to 00, making it the end of an hour
    random_date_at_hour_end = random_date.replace(minute=0, second=0, microsecond=0)
    return random_date_at_hour_end

def generate_time_and_toTime():
    """
    Generate "time" and "toTime" where "toTime" is half an hour after "time".
    """
    start_date = datetime(2021, 1, 1)
    end_date = datetime(2024, 1, 1)
    time = generate_random_datetime_at_hour_end(start_date, end_date)
    toTime = time + timedelta(minutes=30)  # Add half an hour
    return time, toTime

# Generate "time" and "toTime"
time, toTime = generate_time_and_toTime()

# Format as strings
time_str = time.strftime("%Y-%m-%dT%H:%M")
toTime_str = toTime.strftime("%Y-%m-%dT%H:%M")

class TestEmissionsAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        super(TestEmissionsAPI, cls).setUpClass()
        
        # Load emissions reference data
        emissions_file_path = os.path.join(os.path.dirname(__file__), '..', 'emissions_data_core_locations.json')
        # emissions_file_path = os.path.join(os.path.dirname(__file__), '..', 'emissions_data.json')
        with open(emissions_file_path, 'r') as emissions_file:
            cls.reference_data = json.load(emissions_file)['Emissions']
        
        locations_file_path = os.path.join(os.path.dirname(__file__), '..', 'locations_test.json')
        # locations_file_path = os.path.join(os.path.dirname(__file__), '..', 'locations.json')
        with open(locations_file_path, 'r') as locations_file:
            cls.regions = json.load(locations_file)['world_azure']
    
    def display_progress_bar(self, current, total):
        bar_length = 50
        progress = float(current) / total
        block = int(round(bar_length * progress))
        text = "\rProgress: [{0}] {1} of {2} regions".format("#" * block + "-" * (bar_length - block), current, total)
        print(text, end='')


    def parse_datetime(self, date_str):
        formats = ["%Y-%m-%dT%H:%M:%S+00:00", "%Y-%m-%dT%H:%M", "%Y-%m-%d"]
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        raise ValueError(f"Time data '{date_str}' does not match any of the expected formats.")

    
    def find_reference_data(self, locations, time, toTime):
        format_str = "%Y-%m-%dT%H:%M:%S+00:00"
        # start_time = self.parse_datetime(time) - timedelta(minutes=30)
        start_time = self.parse_datetime(time)
        # end_time = self.parse_datetime(toTime) - timedelta(minutes=30)
        end_time = self.parse_datetime(toTime)
        print(f"Start time: {start_time}")
        print(f"End time: {end_time}")
        search_start_time = start_time - timedelta(hours=1)
        search_end_time = end_time - timedelta(hours=1)
        print(f"Search start time: {search_start_time}")
        print(f"Search end time: {search_end_time}")
        filtered_data = []
        for entry in self.reference_data:
            entry_time = datetime.strptime(entry['time'], format_str)
            if entry['location'] in locations and search_start_time <= entry_time <= search_end_time:
                filtered_data.append(entry)

        return filtered_data
        # return [entry for entry in self.reference_data if entry['location'] in locations and entry['time'] >= time and entry['time'] <= toTime]


    def test_emissions_by_single_location_for_all_regions(self):
        url = "http://localhost:5073/emissions/bylocation"
        max_retries = 2
        retry_delay = 2
        total_regions = len(self.regions)
        
        # for region in self.regions:
        for index, region in enumerate(self.regions, start=1):
            randomTime,  randomToTime = generate_time_and_toTime()
            print(f"\nRandom time range for region {region}: {randomTime} to {randomToTime}")
            # print(f"\nRandom time range for region {region}: {date} to {toDate}")
            # print(date.strftime("%Y-%m-%d"))
            params = {
                "location": region,
                # "time": date.strftime("%Y-%m-%d"),
                "time": "2023-04-07T00:00",
                "toTime": "2023-04-07T00:30"
                # "time": randomTime.strftime("%Y-%m-%dT%H:%M"),
                # "toTime": randomToTime.strftime("%Y-%m-%dT%H:%M")
            }

            for attempt in range(max_retries):
                response = requests.get(url, params=params)
                
                if response.status_code == 200:
                    # expected_data = self.find_reference_data([region], params["time"], toDate.strftime("%Y-%m-%d"))
                    expected_data = self.find_reference_data([region], params["time"], params["toTime"])
                    print(f"\nExpected data for region {region}: {expected_data}")
                    for item in expected_data:
                        item.pop('duration', None)
                    actual_response = response.json()
                    print(f"Actual response for region {region}: {actual_response}")
                    for item in actual_response:
                        item.pop('duration', None)
                    self.assertEqual(actual_response, expected_data, f"API response did not match the expected output from reference data for region {region}")
                    break
                elif response.status_code == 500:
                    print(f"\nAttempt {attempt + 1} for region {region} failed with 500 Internal Server Error. Retrying...")
                    time.sleep(retry_delay)
                else:
                    self.fail(f"\nAPI returned an unexpected status code: {response.status_code} for region {region}")

            self.display_progress_bar(index, total_regions)
        print("\nAll regions processed.")

if __name__ == "__main__":
    print("Start running tests!(emission with fixtime)")
    unittest.main()