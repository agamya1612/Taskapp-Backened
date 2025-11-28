
FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN addgroup app && adduser -S -G app app
USER app
EXPOSE 4000
CMD [ "node", "src/server.js" ]
