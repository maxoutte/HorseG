FROM mcr.microsoft.com/playwright:v1.44.0-jammy

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN npm run build

RUN mkdir -p data

EXPOSE 3001
CMD ["node", "dist/index.js"]
