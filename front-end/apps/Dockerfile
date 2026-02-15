FROM node:18-alpine

WORKDIR /app

RUN npm init -y \
  && npm install express express-session openid-client

COPY server.js ./server.js

EXPOSE 3000

CMD ["node", "server.js"]
