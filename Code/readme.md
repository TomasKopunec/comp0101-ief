# IF-Optimisation-Models

This project contains the optimisation models for the Impact Framework. Our work environment will be based in this repository.

## Prepare the Environment

> If you are working with Visual Studio Code, you should open this directory (`/Code`) in VSCode. As all the configurations for the IF models environment are already set up in this directory.

Before you start, there are several things you need to prepare in order to setup the development environment for the Impact Framework.

1. In the current directory (`/Code`), run the following command to clone the Impact Framework (IF) repository as a submodule:
    ```bash
    git submodule update --init --recursive
    ```
    This will clone the IF repository into the `\Code\if` directory. This repository is the main repository for the Impact Framework, and this is required for running the `dev` mode for the models.

2. In the `if` directory, run the following command to install the dependencies for the Impact Framework:
    ```
    npm install
    ```
    This will install all the dependencies required for the Impact Framework.

3. In the `if-optimisation-models` directory, run the same command as well to install the dependencies for the developing models repository:
    ```
    npm install
    ``` 

4. In the `if-optimisation-models` directory, check the acess permission for the shell script files, if someof them have no permission to execute, run the following command to give them the permission:
    ```bash
    chmod +x install2if.sh
    chmod +x run.sh
    ```
    This will give the permission to execute the shell script files.

Once you have completed these steps, you are ready to start developing the optimisation models for the Impact Framework.

Remember, all the source files for our models are located in the `if-optimisation-models` directory. You should not commit any changes from the `if` directory, as it is a submodule and all the changes should be made in the `if-optimisation-models` directory.

In the following steps, it is assumed that your current working directory is under the `\Code\if-optimisation-models` directory, but not the `\Code\if` or this `\Code` directory.

## Running Modes

The models in this project is a sub-module for the Impact Framework. The development, testing and deployment are relying on the Impact Framework. There are two modes to deploy and run the models, which are are suitable for different scenarios. You can decide which one to use based on your needs.

These two modes can be run through the *npm scripts*, but in most cases, it is recommended to use the bash script for running in command line. If you want to debug the models, you should use the debugger in VSCode, which is already configured in this repository.

Before we start, please double check that you have completed the steps in the previous section and **cd** (switched working directory) to the `if-optimisation-models` directory.

### Local Mode
This approach is the easiest way to run the models. Once you clone the repository and execute the npm install command, you can run the models in your local machine without any external requirements. **If you only want to run the models in the simplest way in a command line window, without any debugging, this is the best approach.**

The approach copies your compiled files in "build" directory to the local node_modules directory and creates a "dummy" package.json file to make the models available for the Impact Framework. Then invokes the Impact Framework that locally installed in this repository.

### Dev Mode
This approach requires you to have the IF repository cloned in the parent directory of the `if-optimisation-models` repository, which should be there when the repository is cloned recursively. This approach uses the npm link command to create a symbolic link from the node_modules of the IF repository to this repository, then invokes the Impact Framework in the IF repository to run the models in this repository. The configuration for VSCode debugger utilises this mode to run the models. **If you want to debug the models, this is the best approach. But you are more likely to run with this mode by using the debugger in VSCode but not the command line.**

## Deployment and Running

You can either use NPM Scripts command or the bash script to run the model in local or dev mode. ***Currently, the bash script is recommended as it is more convenient and easier to use.***

### NPM Scripts

There are four types of NPM scripts, which are **`build`, `install2if`, `if` and `install-and-exec`**.

You can use
```bash
npm run <script_name>
```
to run the script.

**`build`** command is used to compile and build the models from source files. 

**`install2if`** command is used to build and install the models to the Impact Framework. This command will first execute the `build` command to compile and build the models from source files, then do copy or link operations to install the models to the Impact Framework. The default mode is local mode.

**`if`** command is used to run the ``*IF*`` executable, which is the Impact Framework. This command will only invoke the Impact Framework to run the models. With no build or install operations. The default mode is local mode.

**`install-and-exec`** command is used to combine the `install2if` and `if` commands. This command will first execute the `install2if` command to install the models to the Impact Framework, then execute the `if` command to run the models. The default mode is local mode.

You can use the following format in CLI to specify the mode and the impl file:
```bash
npm run <script_name>:<mode> -- --impl <impl_path>
```

For example, if you want to build, install and run the model in local mode, you can use the following command:
```bash
npm run install2if:local
npm run if:local -- --impl <impl_path>
```
or simply use this command in one line:
```bash
npm run install-and-exec:local -- --impl <impl_path>
```

Similarly, you can use these commands to run the model in dev mode:
```bash
npm run install2if:dev
```
Then you can run the IF by using this command:
```bash
npm run if:dev -- --impl <impl_path>
```
Or use the combined command:
```bash
npm run install-and-exec:dev -- --impl <impl_path>
```

### Bash Script
***For most cases, it is recommneded to use this bash script for running in command line***

The bash script is more convenient and easier to use than the NPM scripts. The bash script "run.sh" is virtually equivalent to the "install-and-exec" NPM script, so you don't need to run any other commands to build or install the models other than itself.

To run the models in local mode with a specific impl file, you can use the following command to run the shell script:
```bash
./run.sh <impl_name> <mode>
```
Where the argument `<impl_file>` is the file name without the extension `.yml` that located in the `examples` directory, and the argument `<mode>` is an optional argument, which only accepts three values : `local`, `dev` and `dev-no-install` (defaultly `local`). 

For instance, if you want to run the models with the `if-optimisation-models/examples/tester.yml` file in local mode, you can use the following command:
```bash
./run.sh tester local
```
Similarly, if you want to run the models in dev mode, just replace the mode argument with `dev`:
```bash
./run.sh tester dev
```
The ompl (output file) will be saved in the `if-optimisation-models/results` directory.

## Debugging
The debug configurations are already set up in this repository.

Please use VSCode to open the `Code` folder, which contains both the IF and IF-Optimisation-Models repositories, and the vscode config files are also located in this folder.

You can run the debug mode in VSCode debugger and it will run a impl files as specified in the debug configuration. There are two debug configurations: `IF: Launch` and `IF: Launch (No Install)`, both utilise the dev mode to run the models.

***Hint**: you only need to run the debug mode `IF: Launch` for once evert time you open VSCode, since then it will create a symbolic link from the IF repository to this repository and install the models to the IF repository. Any changes you make in this repository will be reflected in the IF repository. So once you have run the `IF: Launch` debug mode, you can run the `IF: Launch (No Install)` debug mode for the rest of the time. Which is much faster than use the `IF: Launch` debug mode.*

***The user might need to run it twice `IF: Launch` if Bugs were met***


Also feel free to change the arguments in the debug configuration to run different impl files.

> Breakpoints can be set in the `if-optimisation-models` repository, no need to go to the `if/node_modules/@grnsft/if-optimisation-models` folder.