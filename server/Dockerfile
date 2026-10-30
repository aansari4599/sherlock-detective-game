FROM node:18-alpine

WORKDIR /app

COPY server/package.json ./
COPY server/package-lock.json ./
RUN npm install --legacy-peer-deps

COPY server/ ./

EXPOSE 3001

CMD ["node", "index.js"]