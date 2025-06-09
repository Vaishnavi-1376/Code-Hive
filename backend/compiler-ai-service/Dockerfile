FROM node:20-alpine

WORKDIR /app

RUN apk update && apk add --no-cache \
    build-base \
    openjdk17 \
    python3 \
    py3-pip \
    gcc \
    g++ \
    make \
    && rm -rf /var/cache/apk/*

COPY package.json package-lock.json ./
RUN npm install --production

COPY . .

EXPOSE 5001

CMD ["node", "index.js"]