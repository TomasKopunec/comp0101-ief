#!/bin/bash

echo "[Fetching Submodules]"
git submodule update --init --recursive

echo "[Building IF]"
cd if-unofficial-models
npm cache clean --force
npm install
yarn build

echo "[Building IF Models]"
cd ../if
npm cache clean --force
npm install
npm install "@grnsft/if-models" "@grnsft/if-unofficial-models"
yarn build

echo "Done."