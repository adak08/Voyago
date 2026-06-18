# -- Stage 1: Build React frontend ----------------------------------
FROM node:20-slim AS frontend-builder

WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=${VITE_API_URL:-https://voyago-jvit.onrender.com/api/v1}
ENV VITE_SOCKET_URL=${VITE_SOCKET_URL:-https://voyago-jvit.onrender.com}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
RUN npm run build

# -- Stage 2: Final runtime image -----------------------------------
FROM python:3.11-slim

# Install Node.js + supervisor
RUN apt-get update && apt-get install -y \
    curl \
    supervisor \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Python AI service
WORKDIR /app/ai_service
COPY ai_service/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY ai_service/ ./

# Node.js backend
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --production
COPY server/ ./

# React build output from Stage 1
COPY --from=frontend-builder /app/client/dist /app/client/dist

# Supervisor config
COPY supervisord.conf /etc/supervisor/conf.d/voyago.conf

WORKDIR /app

EXPOSE 5000

CMD ["supervisord", "-n", "-c", "/etc/supervisor/conf.d/voyago.conf"]
