# Stage 1: Build the React app
FROM node:18-alpine AS builder

WORKDIR /app

COPY client/package.json ./
COPY client/package-lock.json ./
RUN npm install --legacy-peer-deps

COPY client/ ./
ARG REACT_APP_SERVER_URL
ENV REACT_APP_SERVER_URL=$REACT_APP_SERVER_URL
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]