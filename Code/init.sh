#!/bin/bash

# This script is used to initialize the environment for the project.
echo "Cloning submodules..."
git submodule update --init --recursive
git submodule update --recursive --remote

echo "Installing dependencies..."
npm install -g typescript
cd if
npm install
npm install '@grnsft/if-models' '@grnsft/if-unofficial-models'
cd ../if-unofficial-models && npm install && cd ..