FROM node:8.4.0-alpine as builder

RUN apk upgrade --update \
    && apk add mongodb build-base
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app
RUN npm install --loglevel warn
COPY . /usr/src/app
