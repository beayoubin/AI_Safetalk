FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache font-noto-cjk

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY config ./config
COPY src ./src

RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]
