#!/bin/bash

docker build --no-cache  -t ief_image -f Dockerfile.mac .
echo "Docker image built."

docker run -it --net=host --name ief_runner ief_image
