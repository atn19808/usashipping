FROM node:18-alpine

WORKDIR /app

RUN npm install -g npm@9

COPY package*.json .

RUN npm install

COPY themes ./themes
COPY extensions ./extensions
COPY config ./config
# COPY media ./media
COPY public ./public
COPY translations ./translations

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]