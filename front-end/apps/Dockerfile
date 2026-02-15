FROM node:18-alpine
WORKDIR /app
RUN npm install express openid-client
COPY server.js .
cmd ["node", "server.js"]