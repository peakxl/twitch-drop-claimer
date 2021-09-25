FROM node:14-alpine3.14
LABEL maintainer peakxl

ENV NODE_ENV=production

RUN apk add --no-cache --update chromium nss freetype harfbuzz ca-certificates ttf-freefont dumb-init && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json .

RUN npm ci --production

COPY . .

CMD ["npm","start"]
