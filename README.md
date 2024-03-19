# comp0101-ief
Impact Engine Framework 

## Project Team
- Bouras, Dimitrios TL
- Gudmundsdottir, Telma
- Kopunec, Tomas
- Lou, Jiafan
- Lu, Jiashun
- Saleh, Mohamed
- Wang, Yi-Yu
- Wang, Derek

# Background Reading
[Green Software Foundation](https://github.com/Green-Software-Foundation) <br/>
[Green Software Foundation Documentation](https://github.com/Green-Software-Foundation/if-docs/tree/master/docs) <br/>
[Software Carbon Intensity Specification](https://github.com/Green-Software-Foundation/sci/blob/main/Software_Carbon_Intensity/Software_Carbon_Intensity_Specification.md) <br/>
[Green Software for Practitioners](https://training.linuxfoundation.org/training/green-software-for-practitioners-lfc131/) <br/>

# Project Brief
**Staff:**
- Chris Lloyd-Jones
- Avanade, Head of Open Innovation
- Asim Hussain - Green Software Foundation director, Open Source WG PM 
- Sophie Trinder – Green Software Foundation director, Open Source WG PM 

Here is the link to the resource: [Link](https://github.com/Green-Software-Foundation/if)

## Video Presentation Link
https://youtu.be/YYdt-9RIYiU

## Project Description
As digital transformation accelerates, the environmental impact of software becomes increasingly significant. The Impact Engine Framework (IEF) project, initiated by the Open Source Working Group at the Green Software Foundation, aims to address this challenge. The IEF is designed to Model, Measure, siMulate, and Monitor the environmental impacts of software components across diverse computing environments. With software now running on an array of platforms - from clouds to containers, and mobile devices to desktops - each ecosystem presents unique measurement challenges. This project seeks to streamline the process, developing a unified framework that can adapt to various environmental metrics, reducing the friction currently associated with assessing software emissions.

## Key Expected Outcome
Extend the IEF adaptable framework capable of modeling and measuring the environmental impact of software across multiple environments, to edge devices, or another specifically selected environment.
Produce either:
•	A simulation tool to forecast potential emissions based on software design choices.
•	A monitoring tool that provides ongoing environmental impact assessments.
These must have an open-source repository and documentation to facilitate community contributions and adoption.

## Core Requirements
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

##The final report is shared in the microsoft teams channel of the project team


Follow these steps to set up the SDK API:

1. **Start the API:**
   - Open a terminal window in the root directory of your project.
   - Execute the script by running:
     \```
     ./api_start.sh
     \```

2. **Open Command Palette:**
   - Press `Ctrl` + `Shift` + `P` to open the Command Palette in your code editor.

3. **Select Project Folder:**
   - Use the Command Palette to select the `carbon-aware-sdk` folder, which should be located in the same directory where you cloned this project.

4. **Run Startup Script:**
   - In the terminal that opens within your selected folder, start the necessary services by running:
     \```
     ./start.sh
     \```

# Running the Dockerized Version

To use the Dockerized version of the application, follow these steps:

1. **Run Docker Container:**
   - In a new terminal window, initiate the Docker container by running:
     \```
     ./docker_run.sh
     \```
   - This process might take up to 3 minutes as the Docker image is being built.

2. **Using the Docker Environment:**
   - Once the Docker container is ready, you'll be automatically placed into the Docker environment's terminal.
   - To execute implementation files located in the `examples` folder, use the following command structure:
     \```
     ./run.sh <file_name>
     \```
     For instance, if you want to run an example file named `new_carbon1.yml`, you would execute:
     \```
     ./run.sh new_carbon1
     \```
