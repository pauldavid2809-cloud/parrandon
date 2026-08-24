FROM node:20-alpine

# Instalar git y herramientas necesarias para compilar paquetes de baileys
RUN apk add --no-cache git python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3001

CMD ["node", "index.js"]
