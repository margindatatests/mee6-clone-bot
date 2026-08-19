FROM node:18-alpine

WORKDIR /app

# Instalar ferramentas de build nativo para o Alpine
RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
