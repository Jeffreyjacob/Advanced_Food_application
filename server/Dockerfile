FROM node:18-alpine AS dev
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
EXPOSE 8000
CMD ["npm","run","dev"]


FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build


FROM node:18-alpine AS production
WORKDIR /app
COPY package*.json .
RUN npm ci --only=production
COPY --from=build /app/dist ./dist
CMD ["node","dist/index.js"]

