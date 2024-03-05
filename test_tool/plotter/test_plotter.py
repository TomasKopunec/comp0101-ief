#!/bin/env python3
import sys
import yaml
import matplotlib.pyplot as plt
import os
import pandas as pd

def plot_values(x_values, y_values, filename, graph_title, x_axis_label, y_axis_label, colour, graph_type='bar'):
    """
    This function plots a graph based on the provided x and y values, saves it to a file, and supports different types of graphs.
    
    Parameters:
    - x_values: List of x-axis values.
    - y_values: List of y-axis values.
    - filename: Name of the file to save the plot.
    - graph_title: Title of the graph.
    - x_axis_label: Label for the x-axis.
    - y_axis_label: Label for the y-axis.
    - colour: Colour of the plot elements.
    - graph_type: Type of graph ('bar', 'line', 'scatter'). Default is 'bar'.
    
    The function sorts the x and y values based on y values, creates a matplotlib plot, and saves the plot to the specified filename.
    """
    if len(x_values) != len(y_values):
        raise ValueError("x_values and y_values must have the same length.")

    # Sorting the values based on y_values for consistent plotting
    sorted_pairs = sorted(zip(x_values, y_values), key=lambda pair: pair[1])
    sorted_x_values, sorted_y_values = zip(*sorted_pairs)

    plt.figure(figsize=(10, 6))
    plot_function = {'bar': plt.bar, 'line': plt.plot, 'scatter': plt.scatter}
    if graph_type in plot_function:
        plot_function[graph_type](sorted_x_values, sorted_y_values, color=colour)
    else:
        raise ValueError(f"Unsupported graph type: {graph_type}")

    plt.title(graph_title)
    plt.xlabel(x_axis_label)
    plt.ylabel(y_axis_label)
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig(filename)



# Reading YAML input from stdin
# Check if the file path argument is provided
if len(sys.argv) < 2:
    print("Usage: python script.py <path_to_yaml_file>")
    sys.exit(1)

file_path = sys.argv[1]  # The first argument after the script name

try:
    with open(file_path, 'r') as file:
        data = yaml.safe_load(file)
    
    
    #y_name is always a required parameter
    if 'y_name' not in data:
            raise KeyError(f"Required parameter y_name is missing.")
    y_label = data['y_name']
    
    #You either plot from a csv or from a dictionary called plotted_points
    if 'plotted_points' not in data and 'csv_path' not in data:
        raise KeyError("Missing one of the required parameters: 'plotted_points' or 'csv_path, one of them must be specified'.")
    
    #You cant plot both from a csv and from a dictionary called plotted_points
    if 'plotted_points' in data and 'csv_path' in data:
        raise KeyError("Cant specify both 'plotted_points' and 'csv_path', only one of them must be specified.")
    
     # Setting default values for optional parameters or overridding them if they are specified
    x, y = [], []
    colour = data.get('colour', 'skyblue')
    
    y_axis_name = data.get('y_axis_name', y_label)
    diagram_name = data.get('diagram_name', 'combinations_diagram')
    
    graph_type = data.get('graph_type', 'bar')
    
    #this case we are plotting from dictionary plotted_points founf in the impl file
    if 'plotted_points' in data:
        #if we are plotting from a dictionary we need to have the x_name key
        if 'x_name' not in data:
            raise KeyError("Missing the required x_name key for plotted_values.")
        x_labels = data['x_name']
        x_axis_name = data.get('x_axis_name', '_'.join(x_labels))
        plot_dict = data.get('plotted_points', [])
        for item in plot_dict:
            x_value = "_".join(str(item.get(label, '')) for label in x_labels).rstrip('_')
            #All the x_values must be present in the dictionary
            if not x_value:
                raise KeyError(f"Missing one of the required x_name keys in plotted_values: {x_labels}")
            #get the y_value from the dictionary
            y_value = item.get(y_label)
            if y_value is None:
                raise KeyError(f"Missing the required y_name key in plotted_values: {y_label}")
            #x and y ara the lists we will use to plot the diagram
            x.append(x_value)
            y.append(y_value)
    
    #in this case we are plotting from a csv file
    if 'csv_path' in data:
        #open the csv file and read the data in a pandas dataframe
        #try to open csv and if not found produce error
        if not os.path.exists(data['csv_path']):
            raise FileNotFoundError(f"File {data['csv_path']} not found.")
        csv_path = data['csv_path']
        df = pd.read_csv(csv_path)
        #the x axis will always be the colums of the dataframe except the first one which is the PATH
        columns = df.columns.tolist()
        x=columns[1:]
        #the x_axis name will probably always be date or type of carbon
        x_axis_name = data.get('x_axis_name', "Carbon Date or Type")
        #find the row which describes the y_label.(the first element of the row is the y_label)
        rows_with_Y = df.loc[df.iloc[:, 0] == y_label]

        if not rows_with_Y.empty:
            # Keep only the row where the first column starts with  y_label
            y = rows_with_Y.iloc[0, 1:].tolist()
        else:
            # Raise an error if no such rows exist
            raise ValueError(f"No rows start with {y_label} in the first column.")
        
       
    diagram_title = data.get('diagram_title', f'{x_axis_name} vs {y_axis_name}')
    #plot the diagram
    plot_values(x, y, diagram_name, diagram_title, x_axis_name, y_axis_name, colour, graph_type)

    #set the path of the diagram in the ompl file
    current_path = os.getcwd()
    data['diagram'] = current_path + "/"+diagram_name+".png"        
    print(data)
        
except yaml.YAMLError as e:
    print("Error parsing YAML:", e)