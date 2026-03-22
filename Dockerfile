FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Frontend deps
COPY package.json ./
RUN npm install

# Backend deps
COPY backend/package.json backend/
RUN cd backend && npm install

# Copy everything (assets already extracted by install.sh)
COPY . .

# Ensure permissions
RUN chmod +x backend/bin/rhubarb scripts/start.sh

EXPOSE 5173 3000

CMD ["bash", "scripts/start.sh"]
