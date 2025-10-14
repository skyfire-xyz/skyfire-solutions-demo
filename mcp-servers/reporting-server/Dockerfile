# syntax=docker/dockerfile:1
FROM --platform=linux/amd64 node:20.16.0-alpine3.20 as build

WORKDIR /app
COPY package.json yarn.lock .npmrc ./
RUN yarn install --frozen-lockfile
COPY tsconfig.json tsconfig.json
COPY src src

RUN yarn tsc
RUN yarn install --prod --frozen-lockfile

FROM --platform=linux/amd64 node:20.16.0-alpine3.20


RUN apk add --no-cache tini
# Tini is now available at /sbin/tini
# Render.com overrides entrypoint
ENTRYPOINT ["/sbin/tini", "--"]

EXPOSE 4000


# Copy built files
ENV NODE_ENV=production
ARG GIT_COMMIT
ENV GIT_COMMIT=$GIT_COMMIT
WORKDIR /app
COPY package.json .
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/build ./build
COPY --from=build --chown=node:node /app/tsconfig.json ./tsconfig.json

USER node

CMD ["yarn", "start"]
