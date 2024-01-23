# IF-Optimisation-Models

This project contains the optimisation models for the Impact Framework. Our work environment will be based in this repository.

## Deploy & Run

The models in this project are the submodules of the Impact Framework. There are three approaches to install and run the models. All the three ways can be accessed by running the npm script commands.

### Approach 1: Local Mode
This approach is the easiest way to run the models. Once you clone the repository and execute the npm install command, you can run the models in your local machine without any external requirements.

The approach copies your compiled files in "build" directory to the local node_modules directory and creates a "dummy" package.json file to make the models available for the Impact Framework. Then invokes the Impact Framework that locally installed in this repository.

***So here are the steps to run the models in local mode.***

After you clone the repository, run npm install as usual:
```bash
npm install
```

Then, you can install the model to local by using this command:
```bash
npm run install2if:local
```

Finally, you can run the model by using this command:
```bash
npm run if:local -- --impl <impl_file>
```

You can also use the script. For instance(Check the yaml under examples):
```bash
./run.sh tester
```

If this is the first time you run the script, you may encounter permission problems,use this:
```bash
chmod +x run.sh
```

Or you can use one command to install and run the model:
```bash
npm run install-and-exec:local -- --impl <impl_file>
```

> The default mode is also local mode, so running these commands without specifying `:local` will also work the same.

### Approach 2: Global Mode

This approach is also very easy to run the models. The only additional requirements to run in global mode is you install the "grnsft/if" in global npm node_modules. This approach uses the npm link command to create a global link to the models, then invokes the global Impact Framework to run the models in this repository.

Similarly, you can use this command to install the model to global:
```bash
npm run install2if:global
```

Then you can run the model by using this command:
```bash
npm run if:global -- --impl <impl_file>
```
For example:
```bash
npm run if:global -- --impl examples/tester.yml
```
And the combined command is the same as the local mode:
```bash
npm run install-and-exec:global -- --impl <impl_file>
```

### Approach 3: Dev Mode

This approach requires you to have the IF repository cloned in the parent directory of this repository, which should be there when the repository is cloned recursively. This approach uses the npm link command to create a symbolic link from the node_modules of the IF repository to this repository, then invokes the Impact Framework in the IF repository to run the models in this repository.

This approach is most useful because this is the only mode that allows you to debug models. All the debug configurations (for VSCode) are already set up in this repository. You can simply run the debug mode in VSCode and it will run the models in the IF repository. See next section for more details.

Similarly, you can use this command to install the model to dev:
```bash
npm run install2if:dev
```

Then you can run the model by using this command:
```bash
npm run if:dev -- --impl <impl_file>
```
For example:
```bash
nnpm run if:dev -- --impl examples/tester.yml
```

## Debugging

The debug configurations are already set up in this repository.

Please use VSCode to open the `Code` folder, which contains both the IF and IF-Optimisation-Models repositories, and the vscode config files are also located in this folder.

You can run the debug mode in VSCode debugger and it will run a impl files as specified in the debug configuration. There are two debug configurations, both utilise the dev mode to run the models.

However, there's one thing to notice. You only need to run the debug mode `IF: Launch` for once, since then it will create a symbolic link from the IF repository to this repository and install the models to the IF repository. Any changes you make in this repository will be reflected in the IF repository. So once you have run the `IF: Launch` debug mode, you can run the `IF: Launch (No Install)` debug mode for the rest of the time.

Also feel free to change the arguments in the debug configuration to run different impl files.
