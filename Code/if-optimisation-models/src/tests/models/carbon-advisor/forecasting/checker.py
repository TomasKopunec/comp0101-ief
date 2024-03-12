import json
import random
from datetime import datetime, timedelta

# Open file in the format { "Date", "Emissions"}
file = open("scenario1.json", "r")
data = json.load(file)

emissions = data["Emissions"]

start_date = datetime(2023, 5, 1)
end_date = datetime(2023, 5, 10)

sum = 0
count = 0
for e in emissions:
    # if in the right interval sum
    if start_date <= datetime.strptime(e["Time"], "%Y-%m-%dT%H:%M:%S+00:00") <= end_date:
        print("Adding " + str(e["Rating"]) + " at " + e["Time"])
        sum += e["Rating"]
        count += 1
print('Average emissions: ' + str(sum / count))

# locations = [
#     "eastus",
# ]

# start_date = datetime(2023, 1, 1)
# end_date = datetime(2025, 1, 1)

# times = []
# current_date = start_date

# while current_date <= end_date:
#     for hour in range(0, 24, 4):
#         times.append(current_date.replace(
#             hour=hour).strftime("%Y-%m-%dT%H:%M:%S+00:00"))
#     current_date += timedelta(days=1)

# output = []
# for location in locations:
#     for time in times:
#         rating = 10 if str(time).startswith("2024") else random.randint(1, 30)
#         output.append({
#             "Location": location,
#             "Time": time,
#             "Rating": rating,
#             "Duration": "04:00:00"
#         })

# # Date in the format: Date":"11/17/2021 4:45:11 AM","Emissions":
# print(json.dumps({
#     "Date" : start_date.strftime("%m/%d/%Y %I:%M:%S %p"),
#     "Emissions": output
# }, indent=4))
