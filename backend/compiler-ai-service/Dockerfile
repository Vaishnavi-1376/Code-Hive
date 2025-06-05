# Dockerfile for compiler-ai-service

# Use a Node.js base image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# --- Install compilers and runtimes for different languages ---
RUN apk update && apk add --no-cache \
    build-base \
    openjdk17 \
    python3 \
    py3-pip \
    gcc \
    g++ \
    make \
    && rm -rf /var/cache/apk/*

# --- Install Node.js dependencies for compiler-ai-service ---
COPY package.json package-lock.json ./
RUN npm install --production

# --- Install Python dependencies (if any for AI) ---
# If you have a requirements.txt file for Python dependencies in your compiler-ai-service folder,
# uncomment the following lines.
# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt

# --- Copy your compiler-ai-service code ---
COPY . .

# Expose the port your compiler-ai-service listens on
EXPOSE 5001

# Define the command to run your compiler-ai-service application
CMD ["node", "index.js"]