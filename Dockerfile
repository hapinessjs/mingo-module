FROM node:8.4.0-alpine as builder

RUN apk upgrade --update
RUN apk add mongodb build-base
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app
RUN npm config set registry http://nexus.in.tdw/repository/npm
RUN npm install --loglevel warn
COPY . /usr/src/app
RUN npm run build
