# Setup

## Global installation

If you want to install IF globally, follow the official documentation: https://github.com/Green-Software-Foundation/if-docs/blob/master/docs/04-getting-started.md

## From repository

> All the npm commands in this section can be replaced with equivalent yarn commands.

If you cloned the IF repository and you want to make it run from the source code in the repository, follow these steps:

1. Check your Node.js version. IF requires Node 18. Versions higher or lower than 18 are not supported. Also make sure you have yarn installed. If you don't have yarn, install it with `npm install -g yarn`.

2. Clone the IF repository, and cd into the directory:

   ```bash
   git clone https://github.com/Green-Software-Foundation/if.git
   cd if
   ```
3. Install the dependencies:

   ```bash
   npm install
   ``` 
   and install models **locally**:
   ```bash
   npm install "@grnsft/if-models" "@grnsft/if-unofficial-models"
   ```

4. Use the following command to run the unit test for IF:
   
   ```bash
   yarn run test
   ```
   if Everything is OK, you should see all tests passed with no errors.

5. Try run a example impl file, provided by the official document, create a yaml file and name it `example.yml`, copy the following content into it:
   ```yaml
   name: example
   description: a simple example manifest
   tags:
   initialize:
   models:
      - name: teads-curve
         model: TeadsCurveModel
         path: "@grnsft/if-unofficial-models"
      - name: sci-e
         model: SciEModel
         path: "@grnsft/if-models"
      - name: sci-m
         path: "@grnsft/if-models"
         model: SciMModel
      - name: sci-o
         model: SciOModel
         path: "@grnsft/if-models"
      - name: sci
         model: SciModel
         path: "@grnsft/if-models"
   graph:
   children:
      child: # an advanced grouping node
         pipeline:
         - teads-curve
         - sci-e
         - sci-m
         - sci-o
         - sci
         config:
         teads-curve:
            thermal-design-power: 65
         sci-m:
            total-embodied-emissions: 251000 # gCO2eq
            time-reserved: 3600 # 1 hour in s
            expected-lifespan: 126144000 # 4 years in seconds    
            resources-reserved: 1 
            total-resources: 1 
         sci-o:
            grid-carbon-intensity: 457 # gCO2/kwh
         sci:
            functional-unit-duration: 1 
            functional-duration-time: ''
            functional-unit: requests # factor to convert per time to per f.unit
         inputs:
         - timestamp: '2023-07-06T00:00'
            duration: 10
            cpu-util: 50
            e-net: 0.000811 #kwh     
            requests: 380
   ```

   Then run the following command to execute the example impl file:
   ```bash
   yarn impact-engine --impl example.yml --ompl example-output.yml
   ```
   If the command runs successfully, you should see a file named `example-output.yml` in the same directory, the output information is located at the last section of this file. You may see some warnings in the output, but you can ignore these warning messages for now.

6. Try run a couple more example impl files, which located in the `examples/impls` directory, for example:
   ```bash
   yarn impact-engine --impl examples/impls/test/metadata.yml --ompl examples/ompls/metadata.yml
   ```
   If you encounter any errors like this:
   ```
   ModelCredentialError: Initalization param 'model' is missing.
   ```
   That means this yaml file incorrectly specified the model type or path. Some of these models state the model type as `builtin` with an empty `path` parameter, which in fact is not a valid model type yet. You can try to remove the `type` parameter and edit the path `@grnsft/if-models` or `@grnsft/if-unofficial-models` for the model in their yaml file, and run the command again. If you see the same error message, that means this model is not implemented yet, you can try to use other models.

   > Note: There's one impl file `examples/impls/test/azure.yml` is not working currently, if you try to run it, you will get many error messages. This is because the model `azure-importer` requires something like a token or authentication information in the environment variable, which were not provided to us. So we can just ignore this impl file for now.
