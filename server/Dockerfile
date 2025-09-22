# Dev stage
FROM node:18-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8000
CMD ["npm","run","dev"]

# Build stage
FROM node:18-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Allow Node more memory for TypeScript build
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
CMD ["node","dist/index.js"]
