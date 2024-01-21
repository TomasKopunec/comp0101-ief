#!/bin/bash

# This script is used to initialize the environment for the project.
echo "[Cloning Submodules]"
git submodule update --init --recursive
git submodule update --recursive --remote
echo "Done."

echo "[Installing Dependencies]"
npm list typescript | grep typescript || npm install -g typescript
npm list yarn | grep yarn || npm install -g yarn

cd if
npm install
npm install '@grnsft/if-models' '@grnsft/if-unofficial-models'
yarn build

cd ../if-unofficial-models
npm install
yarn build

echo "Done."