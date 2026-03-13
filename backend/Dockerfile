FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY src/ ./src/
RUN mkdir -p logs
EXPOSE 3001
CMD ["node", "src/server.js"]
