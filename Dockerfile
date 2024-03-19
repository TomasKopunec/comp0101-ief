# Start with a Node.js 14 base image
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Install Python 3, pip, and Git
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv git

# Clone your repository
RUN git clone https://github.com/TomasKopunec/comp0101-ief.git


# Change the working directory to your repository's directory
WORKDIR /usr/src/app/comp0101-ief/Code/if-optimisation-models
RUN git pull

# Install Node.js dependencies defined in your project's package.json
RUN npm install

# Create a Python virtual environment and activate it
RUN python3 -m venv /usr/src/app/venv
ENV PATH="/usr/src/app/venv/bin:$PATH"

# Install Python libraries within the virtual environment
RUN pip install matplotlib PyYAML pandas

# Install any additional Python dependencies defined in a requirements.txt file
# Uncomment and modify the line below if you have specific Python dependencies
#RUN pip install -r requirements.txt

# Open a Bash shell when the container launches
CMD ["bash"]
