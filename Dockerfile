# Lightweight Node image
FROM node:20-alpine

WORKDIR /app

# Copy package files and install (including devDependencies for build)
COPY package*.json ./
RUN npm ci

# Copy source and build TypeScript
COPY . .
RUN npm run build

# Expose API port (override via env PORT)
EXPOSE 5000

# Default: run API server (worker overrides with command in compose)
CMD ["node", "dist/server.js"]
