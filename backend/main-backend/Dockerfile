# Dockerfile for main-backend

# Use a Node.js base image (Alpine is lightweight)
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package.json package-lock.json ./

# Install Node.js dependencies for the main-backend
RUN npm install --production

# Copy the rest of your main-backend application code
COPY . .

# Expose the port your main-backend Node.js app listens on
EXPOSE 5000

# Define the command to run your main-backend application
CMD ["node", "index.js"]