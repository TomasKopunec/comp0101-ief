
# Implementation of parameter optimisation and isualisation models for the Impact Engine Framework
## Project Description
This project includes the creation and integration of three unique models inside the Impact Engine Framework (IF) to support green computing practices in response to the growing environmental concerns connected with the carbon footprint of information and communication technologies.

The Carbon Advisor, Right-sizing, and Plotter models are intended to support organisations and software developers in making well-informed decisions that minimise energy use and lower carbon emissions without sacrificing functionality. Utilising the Carbon Aware SDK, the Carbon Advisor model determines the optimal carbon-efficient operating parameters—like time and place—for software programmes to function. The goal of the right-sizing model is to minimise wasted energy and capacity by optimising the use of cloud resources. Lastly, the Plotter model's user-friendly visualisations improve the clarity and accessibility of complicated environmental data. Our extensive testing, which includes usability, performance, and unit evaluations, shows how well the models work to encourage software developers to embrace environmentally responsible practices. Future work will focus on refining these models and exploring additional avenues for reducing the tech industry's environmental footprint.

## Project Team
- Bouras, Dimitrios TL
- Gudmundsdottir, Telma
- Kopunec, Tomas
- Lou, Jiafan
- Lu, Jiashun
- Saleh, Mohamed
- Wang, Yi-Yu
- Wang, Derek

## Background Reading
[Green Software Foundation](https://github.com/Green-Software-Foundation) <br/>
[Green Software Foundation Documentation](https://github.com/Green-Software-Foundation/if-docs/tree/master/docs) <br/>
[Software Carbon Intensity Specification](https://github.com/Green-Software-Foundation/sci/blob/main/Software_Carbon_Intensity/Software_Carbon_Intensity_Specification.md) <br/>
[Green Software for Practitioners](https://training.linuxfoundation.org/training/green-software-for-practitioners-lfc131/) <br/>

## GSF Team
- Chris Lloyd-Jones
- Asim Hussain - Green Software Foundation director, Open Source WG PM 
- Sophie Trinder – Green Software Foundation director, Open Source WG PM 

Here is the link to the resource: [Link](https://github.com/Green-Software-Foundation/if)

## Video Presentation for Requirements Phase Link
[View on youtube](https://youtu.be/YYdt-9RIYiU)

## Final Video Presentation for Implemented Project Link
[View on youtube TBD]()

## Models Implemented

### Carbon-aware-advisor
The CarbonAwareAdvisor model is designed to provide carbon emission data based on specified locations and timeframes. It interacts with the Carbon Aware SDK to fetch the most carbon-efficient options for given parameters.

#### Key Features
- **Location Filtering**: Users can specify a list of locations to consider for carbon emission data.
- **Timeframe Filtering**: Users can define time ranges to narrow down the search for carbon emission data.
- **Sampling**: An optional parameter that allows users to specify the number of data points to sample from the available data, providing a broader view of the carbon emission landscape. If sampling is not defined in the impl then no data points are sampled and the plotted-points is not added in the ompl.
#### Outputs
- **Suggestions:**: List of the best location and time combination to minimize the carbon score along with that score.
- **Plotted-points:**: ONLY IF THE SAMPLING PARAMETER IS INITIALIZED IN THE IMPL. A sampling number of samples for trade-off visualization. A best combination from each timeframe is always included . So sampling must be >= number of time regions in the allowed-timeframes. The plotter model can then be used in the pipeline to plot this samples.
#### Link for carbon aware advisor 
[The carbon aware advisor model and its documentation can be found here](https://github.com/TomasKopunec/comp0101-ief/tree/main/Code/if-optimisation-models/src/lib/carbon-aware-advisor)

### Right-Sizing
The right-sizing model for Impact Engine Framework is designed to identify cloud computing instances that better align with the performance and capacity requirements of the customer's workload, with the goal of achieving the highest possible cpu usage , ram usage while minimising the cost and maintaining performance . It takes input in yaml format, ultimately providing more optimal instances based on the current cloud instance type, cloud vendor, current CPU utilization, target CPU utilization, and RAM requirements. Currently, this model primarily targets virtual machines of Azure and AWS.
#### Link for right-sizing
[The right-sizing model and its documentation can be found here](https://github.com/TomasKopunec/comp0101-ief/tree/main/Code/if-optimisation-models/src/lib/right-sizing)

### Plotter
The Plotter model created for the Impact Engine Framework is designed to visualize data through various types of graphs such as bar, line, and scatter plots. It takes input in YAML format or csv format , defining the x and y values along with additional parameters to customize the plots.
This model is typically used in a pipeline following data-enrichment models like carbon-advisor, which populates the plotted-points parameter required by Plotter. If the user prefers he can specify the plotted-points parameter himself in the Impl file but the main value of the model is its ability to visualize the data provided by other models of the Impact Engine Framework. The user can also specify a csv file to read the data to plot from.

#### Link for plotter
[The plotter model and its documentation can be found here](https://github.com/TomasKopunec/comp0101-ief/tree/main/Code/if-optimisation-models/src/lib/plotter)

## Installation 
### Prerequisites
Make sure you have Node.js version 18 installed
  - Execute the following commands to install Node Version Manager and switch to version 18
    ```
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
    nvm install 18
    nvm use 18
    ```
### Install instructions
. **Initiate the npm project:**
   - Execute the following commands
     ```
     cd Code/if-optimisation-models
     npm install
     ```

2. **Calculating an Impl file:**
   
   - To execute implementation files located in the `examples` folder, use the following command structure:
     ```
     ./run.sh <file_name>
     ```
     For instance, if you want to run an example file named `new_carbon1.yml`, you would execute:
     ```
     ./run.sh new_carbon1
     ```
 - For instruction on how to write Impl files and the available model check the [Official IEF documentation](https://if.greensoftware.foundation/major-concepts).

## Running the Dockerized Version

  ### Tutorial video
  [![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/ZviLlhq5EFo/maxresdefault.jpg)](https://www.youtube.com/watch?v=ZviLlhq5EFo)\
To use the Dockerized version of the application, follow these steps:

1. **Run Docker Container:**
   - In a new terminal window, initiate the Docker container by running:
     ```
     ./docker_run.sh
     ```
   - This process might take up to 3 minutes as the Docker image is being built.
   
   **Alternatively build from Dockerfile**
- The Dockerfile  can be find in the parent directory comp0101-ief
- Build and run it using:
   ```
    docker build --no-cache  -t ief_image .
    docker run -it --net=host --name ief_runner ief_image 
  ```

2. **Using the Docker Environment:**
   - Once the Docker container is ready, you'll be automatically placed into the Docker environment's terminal.
   - To execute implementation files located in the `examples` folder, use the following command structure:
     ```
     ./run.sh <file_name>
     ```
     For instance, if you want to run an example file named `new_carbon1.yml`, you would execute:
     ```
     ./run.sh new_carbon1
     ```


  ## Starting the Carbon Aware SDK API
  The SDK API is necessary for the carbon-aware-advisor model
  ### Instruction how to Deploy it on localhost
  Detailed instructions on how to run the API on localhost, check [original WebAPI documentation for quickstart](https://if.greensoftware.foundation/major-concepts).

  ### Tutorial video
  [![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/RpT7CtQet1g/maxresdefault.jpg)](https://www.youtube.com/watch?v=RpT7CtQet1g)


  ### Simpler approach 1 - using our method with container
  We have created certain scripts and use a docker container provided to simplify the process of deploying the WebAPI: 
  - You may need to gain administrative or root access to execute the following code.
  1. **Start the API:**
   - Open a terminal window in the root directory of your project.
   - Execute the script by running:
     ```
     ./api_start.sh
     ```

1. **Open Command Palette:**
   - Press `Ctrl` + `Shift` + `P` to open the Command Palette in your code editor.

2. **Select Project Folder:**
   - Use the Command Palette to select the `carbon-aware-sdk` folder, which should be located in the same directory where you cloned this project.

3. **Run Startup Script:**
   - In the terminal that opens within your selected folder, start the necessary services by running:
    ```
     ./start.sh
     ```

### Simpler approach 2 - using our method without in container

#### Prerequisites
Make sure you have .NET Core 6.0 installed (Use ```dotnet --list-sdks``` to check,Prefer version **6.0.418**)
- Simply install it with a single command (For example in Ubuntu ```sudo apt install dotnet-sdk-6.0```). This might download version 6.0.127, if incompatible, proceed to the next step.
- To install the specified version, please visit the [Microsoft .NET 6.0 Download website](https://dotnet.microsoft.com/zh-cn/download/dotnet/6.0) for more information.

#### Installation process
  - You may need to gain administrative or root access to execute the following code.
   - Open a terminal window in the root directory of your project, add execute permissions to the script:
     ``` 
     chmod +x api_start_without_in_container.sh
     ```
   - Execute the script by running:
     ```
     ./api_start_without_in_container.sh
     ```


<!-- ## Core Requirements
- Development of a flexible measurement model for software environmental impact extending IEF.
- Integration capability with various environments (cloud, bare-metal, virtualized, etc.).
- Creation of a simulation tool to project the environmental impact during the design phase or
- Implementation of a monitoring system for continuous impact assessment.
- A user-friendly interface to encourage adoption by software engineers and environmental scientists.
- Compliance with the guidelines and objectives of the Green Software Foundation.

## Expertise/Skills Developed
- Knowledge of environmental science and software sustainability metrics.
- Experience with open-source development and community-driven projects.
- Proficiency in cloud computing, containerization, and various OS environments.

## Devices or Tech Required
- Cloud services for development and testing, potentially leveraging sustainable, green cloud providers.
- Access to containerized environments and virtual machines for testing and simulation.

## Additional Information
- The project aligns with the goals of the Green Software Foundation to reduce the carbon emissions of software.
- Collaboration with the broader open-source community will be essential to ensure the framework's adaptability and effectiveness.
- All contributions to the project will be made under an open-source license to foster transparency and community involvement.

##The final report is shared in the microsoft teams channel of the project team -->



