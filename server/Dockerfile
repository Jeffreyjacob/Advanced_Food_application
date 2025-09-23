# Dev stage
FROM node:20-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8000
CMD ["npm", "run", "dev"]

# Build stage
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

RUN npm run build

# Production stage
FROM node:20-slim AS production   
WORKDIR /app
COPY package*.json ./
COPY package-lock.json ./        
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 8000
CMD ["node", "dist/index.js"]
