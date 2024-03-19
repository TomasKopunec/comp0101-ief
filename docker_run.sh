#!/bin/bash

docker build --no-cache  -t ief_image .
echo "Docker image built."

docker run -it --net=host --name ief_runner ief_image