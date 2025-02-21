FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json .
RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/

COPY package.json .

EXPOSE 3000

ENV NODE_ENV=production

RUN mkdir -p /app/config

ENV STORAGE_DIR=/app/config

CMD [ "node", "build" ]
