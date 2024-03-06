import requests
import unittest
import json
import os
import time
import itertools
import random
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


        cls.region_combinations = cls.generate_random_combinations(cls.regions, 2, 5, 30)

    @classmethod
    def generate_random_combinations(cls, regions, min_size, max_size, max_combinations):
        all_combinations = []
        # Generate combinations for each size within the specified range
        for r in range(min_size, max_size + 1):
            all_combinations.extend(list(itertools.combinations(regions, r)))
        
        # Randomly select a subset of these combinations, not exceeding the max_combinations limit
        if len(all_combinations) > max_combinations:
            selected_combinations = random.sample(all_combinations, max_combinations)
        else:
            selected_combinations = all_combinations

        return selected_combinations
    

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

        # filtered_data = []
        # for entry in self.reference_data:
        #     entry_time = datetime.strptime(entry['time'], format_str)
        #     if entry['location'] in locations and search_start_time <= entry_time <= search_end_time:
        #         # print(f"Entry time: {entry_time}")
        #         filtered_data.append(entry)

        lowest_ratings_per_location = []
        for location in locations:
            location_filtered_data = [entry for entry in self.reference_data if entry['location'] == location and search_start_time <= datetime.strptime(entry['time'], format_str) <= search_end_time]
            if location_filtered_data:
                sorted_data = sorted(location_filtered_data, key=lambda x: x['rating'])
                min_rating = sorted_data[0]['rating']
                lowest_ratings_per_location.extend([entry for entry in sorted_data if entry['rating'] == min_rating])

        return lowest_ratings_per_location


    def find_lowest_rating_across_locations(self, locations, time, toTime):
        all_lowest_ratings = self.find_reference_data(locations, time, toTime)

        # If there are no entries, return an empty list
        if not all_lowest_ratings:
            return []

        # Find the entry with the absolute lowest rating across all locations
        lowest_rating_value = min(entry['rating'] for entry in all_lowest_ratings)

        # Find all entries with this lowest rating value
        lowest_rating_entries = [entry for entry in all_lowest_ratings if entry['rating'] == lowest_rating_value]

        return lowest_rating_entries
    

    def test_emissions_by_single_location_for_all_regions(self):
        url = "http://localhost:5073/emissions/bylocations/best"
        max_retries = 2
        retry_delay = 2
        total_regions = len(self.region_combinations)
        print("region_combo:",self.region_combinations)
        # for region in self.regions:
        for index, region_combo in enumerate(self.region_combinations, start=1):
            params = {
                "location": region_combo,
                "time": "2022-05-07",
                "toTime": "2022-05-08"
            }

            for attempt in range(max_retries):
                response = requests.get(url, params=params)
                
                if response.status_code == 200:
                    expected_lowest_rating_entry = self.find_lowest_rating_across_locations(region_combo, params["time"], params["toTime"])
                    print(f"\nExpected lowest rating entry: {expected_lowest_rating_entry}")
                    actual_response = response.json()
                    print(f"Actual response: {actual_response}")
                    self.assertEqual(actual_response, expected_lowest_rating_entry, "API response did not match the expected lowest rating entry from reference data")
                    break
                elif response.status_code == 500:
                    print(f"\nAttempt {attempt + 1} for region {region_combo} failed with 500 Internal Server Error. Retrying...")
                    time.sleep(retry_delay)
                else:
                    self.fail(f"\nAPI returned an unexpected status code: {response.status_code} for region {region_combo}")

            self.display_progress_bar(index, total_regions)
        print("\nAll regions processed.")

if __name__ == "__main__":
    print("Start running tests(best)!")
    unittest.main()