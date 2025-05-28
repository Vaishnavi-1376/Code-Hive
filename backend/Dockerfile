FROM node:20-alpine

WORKDIR /app

RUN apk update && apk add --no-cache \
    build-base \
    openjdk17 \
    python3 \
    py3-pip \
    && rm -rf /var/cache/apk/*

COPY . .

RUN npm install

EXPOSE 5000

CMD ["node", "index.js"]