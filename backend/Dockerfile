FROM node:20-alpine

RUN apk add --no-cache tzdata

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./

EXPOSE 3000

CMD ["npm", "run", "dev"]
