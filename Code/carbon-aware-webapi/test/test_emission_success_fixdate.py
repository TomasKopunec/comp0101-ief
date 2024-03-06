import requests
import unittest
import json
import os
import time
from datetime import datetime, timedelta

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
        full_format = "%Y-%m-%dT%H:%M:%S+00:00"
        try:
            return datetime.strptime(date_str, full_format)
        except ValueError:
            return datetime.strptime(date_str + "T00:00:00+00:00", full_format)
    
    def find_reference_data(self, locations, time, toTime):
        format_str = "%Y-%m-%dT%H:%M:%S+00:00"
        start_time = self.parse_datetime(time)
        end_time = self.parse_datetime(toTime)

        search_start_time = start_time - timedelta(hours=1)
        search_end_time = end_time - timedelta(hours=2)
        # search_start_time = start_time
        # search_end_time = end_time + timedelta(hours=1)

        # print(f"Start time: {start_time}")
        # print(f"End time: {end_time}")
        # print(f"Search start time: {search_start_time}")
        # print(f"Search end time: {search_end_time}")

        filtered_data = []
        for entry in self.reference_data:
            entry_time = datetime.strptime(entry['time'], format_str)
            if entry['location'] in locations and search_start_time <= entry_time <= search_end_time:
                print(f"Entry time: {entry_time}")
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
            params = {
                "location": region,
                "time": "2022-05-07",
                "toTime": "2022-05-08"
            }

            for attempt in range(max_retries):
                response = requests.get(url, params=params)
                
                if response.status_code == 200:
                    expected_data = self.find_reference_data([region], params["time"], params["toTime"])
                    print(f"\nExpected data for region {region}: {expected_data}")
                    actual_response = response.json()
                    print(f"Actual response for region {region}: {actual_response}")
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
    print("Start running tests(emission with fixdate)!")
    unittest.main()