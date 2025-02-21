FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN yarn install --frozen-lockfile

COPY . .

RUN mkdir -p /app/config

ENV STORAGE_DIR=/app/config

RUN yarn build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY --from=builder /app/config config/

COPY package.json .
COPY yarn.lock .

EXPOSE 3000

ENV NODE_ENV=production

CMD [ "node", "build" ]
