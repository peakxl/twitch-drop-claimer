FROM node:16-alpine
LABEL maintainer peakxl

ENV NODE_ENV=production

RUN apk add --no-cache --update chromium nss freetype harfbuzz ca-certificates ttf-freefont dumb-init && \
    rm -rf /var/lib/apt/lists/*

ENTRYPOINT ["/usr/bin/dumb-init", "--"]

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --production

COPY . .

USER node

CMD ["npm","start"]
