FROM node:20-slim
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm install --production

# Copy the rest of the application
COPY . ./

# Use npm start script
CMD ["npm", "start"]
