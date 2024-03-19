#!/bin/bash

cd ../../../
# Check if VSCode is installed
if ! command -v code &> /dev/null
then
    echo "VSCode is not installed. Please install VSCode before proceeding."
    exit 1
fi

# Check if Remote Containers extension is installed
if ! code --list-extensions | grep -q "ms-vscode-remote.remote-containers"
then
    echo "Remote Containers extension is not installed. Installing..."
    code --install-extension ms-vscode-remote.remote-containers
else
    echo "Remote Containers extension is already installed."
fi

# Clone the repository
if [ ! -d "carbon-aware-sdk" ]; then
    git clone https://github.com/Green-Software-Foundation/carbon-aware-sdk.git
    echo "Repository cloned."
else
    echo "Repository already exists locally."
fi

cp comp0101-ief/Code/carbon-aware-webapi/start.sh carbon-aware-sdk/


# Change directory into the repository
cd carbon-aware-sdk/

# Open the repository in VSCode
devcontainer up --workspace-folder .
devcontainer exec --workspace-folder . ./start.sh

