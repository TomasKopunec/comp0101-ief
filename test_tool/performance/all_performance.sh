echo "Running all performance tests"
echo "Running visualizer simple"
./overhead.sh performance_sci performance_sci_visualizer_simple
echo "Running visualizer csv"
./overhead.sh performance_sci performance_sci_visualizer_csv
echo "Running carbon2"
./overhead.sh performance_sci performance_sci_carbon2
echo "Running carbon3"
./overhead.sh performance_sci performance_sci_carbon3
echo "Running carbon5"
./overhead.sh performance_sci performance_sci_carbon5
echo "Running low util target"
./overhead.sh performance_sci performance_sci_low_util_target