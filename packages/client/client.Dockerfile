FROM node:18.16-slim

RUN apt-get update && \
    apt-get install -yq jq git unzip && \
    corepack enable

COPY ./artifacts/sanity-runner-client.tgz sanity-runner-client.tgz
RUN tar -xvzf sanity-runner-client.tgz

COPY config.json /config.json
CMD yarn dlx sanity-runner-client@file:./sanity-runner-client --config config.json
