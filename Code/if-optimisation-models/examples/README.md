## Usage 
Move to the Code dir 
```bash
cd ../Code
```
Run one of the examples in the example folder
```bash
./run.sh <example without the suffix>
./run.sh new_carbon1 #example run
```
## Available examples
- low-util-aws: a simple right sizing demo with 2 aws instances
- low-util-azure: a simple right sizing demo with 1 azure instance
- low-util-target: a simple right sizing demo with 1 azure instance and target cpu util < 100
- new_carbon1: a simple carbon advisor demo with 2 timeframes, 2 locations and no sampling
- new_carbon2: a carbon advisor demo with 3 timeframes, 3 locations and sampling = 10
- new_carbon3: the same as new_carbon2 but with no sampling
- new_carbon4: the same as new_Carbon2 but with the plotter model later in pipeline to created a graph of sampled combos
- new_visualizer1: a simple plotter demo, creating a graph of points provided in the Impl file
- new_vizualizer2: a plotter demo plotting data found in the helper2.csv in the csv folder
- new_visualizer3: plotting the data produced by the carbon advisor earlier in the pipeline
