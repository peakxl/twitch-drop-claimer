FROM node:18-alpine

ENV NODE_ENV=production

RUN apk update && apk add --no-cache \
    chromium \
    ca-certificates \
    dumb-init \
    && rm -rf /var/cache/apk/*

ENTRYPOINT ["/usr/bin/dumb-init", "--"]

WORKDIR /usr/src/app

COPY package*.json .

RUN npm ci --production

COPY . .

USER node

CMD ["npm","start"]
