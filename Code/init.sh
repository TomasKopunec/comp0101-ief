#!/bin/bash

# This script is used to initialize the environment for the project.
echo "[Cloning Submodules]"
git submodule update --init --recursive
# dev_model is a fork outside of the IF repository，If run the following statement, it will delete the dev_model, If you get an error telling you that you can't find dev_model, comment out the following line
# git submodule update --recursive --remote
echo "Done."

echo "[Installing Dependencies]"
npm list typescript | grep typescript || npm install -g typescript
npm list yarn | grep yarn || npm install -g yarn
# When running it in a new linux environment, run.sh stuck, because missing ts-node, so I added a one more statement to init.sh
npm list ts-node | grep ts-node || npm install -g ts-node

cd if
npm install
npm install '@grnsft/if-models' '@grnsft/if-unofficial-models'
yarn build

cd ../if-unofficial-models
npm install
yarn build

echo "Done."
