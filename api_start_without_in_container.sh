#!/bin/bash

# Go to the parent directory
cd ../

# Clone the repository
if [ ! -d "carbon-aware-sdk" ]; then
    git clone https://github.com/Green-Software-Foundation/carbon-aware-sdk.git
    echo "SDK Repository cloned."
else
    echo "SDK Repository already exists locally."
fi

echo "Starting API..."

# dotnet_sdk_versions=$(dotnet --list-sdks 2>&1)

# if [[ $? -eq 0 && $dotnet_sdk_versions ]]; then
#   echo "Installed .NET SDK versions:"
# else
#   echo "The .NET SDK is not installed"
# fi

echo "----------------------------------------------------"
echo "Please open another terminal to run the IF framework"
echo "----------------------------------------------------"


cd carbon-aware-sdk/src/CarbonAware.WebApi/src
dotnet run