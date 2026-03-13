# syntax=docker/dockerfile:1
FROM --platform=linux/amd64 node:20.16.0-alpine3.20 as build

WORKDIR /app
ARG NPM_TOKEN
ENV NPM_TOKEN=$NPM_TOKEN
COPY package.json yarn.lock .npmrc ./
RUN test -n "$NPM_TOKEN"
RUN yarn install --frozen-lockfile
COPY tsconfig.json tsconfig.json
COPY src src
COPY lib lib

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
ENV APP_ENV=qa
ARG GIT_COMMIT
ENV GIT_COMMIT=$GIT_COMMIT
WORKDIR /app
COPY package.json .
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/build ./build
COPY --from=build --chown=node:node /app/tsconfig.json ./tsconfig.json
COPY --from=build --chown=node:node /app/lib ./lib

USER node

CMD ["yarn", "start"]
