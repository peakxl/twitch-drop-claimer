FROM node:13-alpine
LABEL maintainer frosty5689 <frosty5689@gmail.com>

RUN apk add --no-cache --update \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && update-ca-certificates \
    && rm -rf /root/.cache

WORKDIR /usr/src/app

COPY . .

RUN npm install

CMD ["npm","start"]
