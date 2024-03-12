import json
import random
from datetime import datetime, timedelta

locations = [
    "eastus",
]

start_date = datetime(2023, 1, 1)
end_date = datetime(2025, 1, 1)

times = []
current_date = start_date

while current_date <= end_date:
    for hour in range(0, 24, 4):
        times.append(current_date.replace(
            hour=hour).strftime("%Y-%m-%dT%H:%M:%S+00:00"))
    current_date += timedelta(days=1)

output = []
for location in locations:
    for time in times:
        # Set score to 1 if the year is 2024, otherwise set it to a random number between 1 and 30
        rating = 1 if str(time).startswith("2024") else random.randint(10, 50)
        output.append({
            "Location": location,
            "Time": time,
            "Rating": rating,
            "Duration": "04:00:00"
        })

# Date in the format: Date":"11/17/2021 4:45:11 AM","Emissions":
print(json.dumps({
    "Date" : start_date.strftime("%m/%d/%Y %I:%M:%S %p"),
    "Emissions": output
}, indent=4))
