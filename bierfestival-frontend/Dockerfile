# Stage 1: Build der React-App
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Setup nginx to serve the app
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Wichtig: Eigene nginx.conf für SPA-Routing
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]