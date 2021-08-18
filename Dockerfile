FROM node:14-alpine
LABEL maintainer peakxl

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
