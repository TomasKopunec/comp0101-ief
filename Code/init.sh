#!/bin/bash

cd if-unofficial-models
npm cache clean --force
npm install
yarn build

cd ../if
npm cache clean --force
npm install
npm install "@grnsft/if-models" "@grnsft/if-unofficial-models"
yarn build