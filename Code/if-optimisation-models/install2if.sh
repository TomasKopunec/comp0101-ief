#!/bin/sh

echo "[Building Models]"
npm run build
echo "Done."

echo "[Installing Models]"
if [ $# -eq 1 ]
then
    if [ $1 = "local" ]; then
        mkdir -p ./node_modules/@grnsft/if-optimisation-models
        rm -rf ./node_modules/@grnsft/if-optimisation-models/build
        cp -r build ./node_modules/@grnsft/if-optimisation-models
        cp package.dummy.json ./node_modules/@grnsft/if-optimisation-models/package.json
    elif [ $1 = "global" ]; then
        npm link
    elif [ $1 = "dev" ]; then
        npm link
        cd ../if && npm link @grnsft/if-optimisation-models
    else
        echo "Invalid argument. Please use either 'local', 'global' or 'repo'."
        exit 1
    fi
    echo "Done."
    exit 0
else
    echo "Invalid number of arguments. Please use either 'local', 'global' or 'repo'."
    exit 1
fi

# echo "[Copying Models]"
# rm -rf ../if/node_modules/@grnsft/if-unofficial-models/build
# cp -r ../if-unofficial-models/build ../if/node_modules/@grnsft/if-unofficial-models
# cp -r build ../if/node_modules/@grnsft/if-unofficial-models
# echo "Done."

# echo "[Linking Models]"
# npm link
# cd ../if && npm link @grnsft/if-optimisation-models
# echo "Done."