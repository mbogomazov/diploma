FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

COPY dist/apps/api ./

RUN npm ci --legacy-peer-deps

CMD [ "node", "main.js" ]