#!/bin/env python3
import sys
import yaml
import matplotlib.pyplot as plt
import random
from datetime import datetime,timedelta
import os
import random
import requests
import json
import time
import random






import matplotlib.pyplot as plt

def plot_values(x_values, y_values, filename, graph_title, x_axis_label, y_axis_label, colour, graph_type='bar'):
    """
    Plots a graph using two lists: one for the x-axis values and one for the y-axis values,
    sorted by the y-axis values in ascending order. The type of graph is determined by the graph_type parameter.
    
    :param x_values: List of values for the x-axis.
    :param y_values: List of values for the y-axis.
    :param filename: The filename where the plot will be saved.
    :param graph_title: The title of the graph.
    :param x_axis_label: The label for the x-axis.
    :param y_axis_label: The label for the y-axis.
    :param colour: The colour of the graph elements.
    :param graph_type: The type of graph to plot ('bar', 'line', 'scatter'). Default is 'bar'.
    """
    # Ensure the lists have the same length for bar, line, and scatter plots
    if graph_type in ['bar', 'line', 'scatter'] and len(x_values) != len(y_values):
        raise ValueError("The length of x_values and y_values must be the same for bar, line, and scatter plots.")

    # Sort x_values and y_values together based on y_values for bar, line, and scatter plots
    if graph_type in ['bar', 'line', 'scatter']:
        sorted_pairs = sorted(zip(x_values, y_values), key=lambda pair: pair[1])
        sorted_x_values, sorted_y_values = zip(*sorted_pairs)
    else:
        sorted_x_values, sorted_y_values = x_values, y_values  # No sorting for other types

    # Create a plot
    plt.figure(figsize=(10, 6))

    if graph_type == 'bar':
        plt.bar(sorted_x_values, sorted_y_values, color=colour)
    elif graph_type == 'line':
        plt.plot(sorted_x_values, sorted_y_values, color=colour)
    elif graph_type == 'scatter':
        plt.scatter(sorted_x_values, sorted_y_values, color=colour)
    else:
        raise ValueError(f"Unsupported graph type: {graph_type}")

    # Set the title and labels for the axes
    plt.title(graph_title)
    plt.xlabel(x_axis_label)
    plt.ylabel(y_axis_label)

    # Rotate the x-axis labels for better readability for bar, line, and scatter plots
    if graph_type in ['bar', 'line', 'scatter']:
        plt.xticks(rotation=45, ha='right')

    # Display the plot
    plt.tight_layout()  # Adjust layout to prevent cutting off labels
    plt.savefig(filename)  # Save the plot to a file



current_path = os.getcwd()
input_lines = []


try:
    # Parse the entire YAML input
    data =  {
    'command': 'python3 ./src/lib/visualizer/plotter',
    'x_name': ['time'],
    'y_name': 'energy',
    'colour': 'yellow',
    'diagram_name': 'm_new_diagram',
    'x_axis_name': 'Name and Last Name',
    'y_axis_name': 'Age in years',
    'diagram_title': 'Name to age comparison',
    'graph_type': 'bar',  # bar, line, or scatter
    'plotted_values': [
        {'time': '12:00:34', 'energy': 5},
        {'time': '13:01:56', 'energy': 3},
        {'time': '14:20:22', 'energy': 8}
    ]
}
   
    
    if data is not None:
        # Extract potential_times and potential_locations
        plot_dict = data['plotted_values']
        x_labels=data['x_name']
        y_label =data['y_name']
        concatenated_string='_'.join(str(item) for item in x_labels)
        if 'colour' in data:
            colour = data['colour']  # Assign the value to my_var if key exists
        else:
            colour='skyblue'
        
        if 'x_axis_name' in data:
            x_axis_name = data['x_axis_name']  # Assign the value to my_var if key exists
        else:
            x_axis_name = concatenated_string

        if 'y_axis_name' in data:
            y_axis_name = data['y_axis_name']  # Assign the value to my_var if key exists
        else:
            y_axis_name= y_label

        if 'diagram_name' in data:
            diagram_name = data['diagram_name']  # Assign the value to my_var if key exists
        else:
            diagram_name= 'combinations_diagram.png'

        if 'diagram_title' in data:
            diagram_title = data['diagram_title']  # Assign the value to my_var if key exists
        else:
            diagram_title= f'{concatenated_string} vs {y_label}'

            
        if 'graph_type' in data:
            graph_type = data['graph_type']  # Assign the value to my_var if key exists
        else:
            graph_type= 'bar'
        
        x =[]
        y =[]
        for item in plot_dict:
            #for label in x_labels:find it in the item as key get its value and append them all together with underscores between and then add it in the x_lables list
            #the label in x lables are the names you should search in the item as keys
            temp=""
            
            for label in x_labels:
                    
                if label in item:
                    temp= temp+str(item[label])+"_"
                    
            #if temp is not empty remove the last character which is an underscore
            if temp:
                temp = temp[:-1]

           
            
        
            x.append(temp)
            y.append(item[y_label])
        # Convert all elements to strings and concatenate with underscores
        
        plot_values(x,y,diagram_name, diagram_title,x_axis_name, y_axis_name, colour,graph_type)
        data['diagram'] = current_path + '/combinations_diagram.png'
        
        print(data)
        
except yaml.YAMLError as e:
    print("Error parsing YAML:", e)
