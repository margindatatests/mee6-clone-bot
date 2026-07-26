# Use lightweight official Node.js LTS image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package definition files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose HTTP port if needed
EXPOSE 3000

# Command to run the bot
CMD ["node", "index.js"]
