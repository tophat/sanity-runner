# Use aws lambda base image
FROM public.ecr.aws/lambda/nodejs:16

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Install system dependencies
RUN yum install -y git make gcc gcc-c++ tar && \
    corepack enable

COPY ./docker/.yarnrc.yml ./docker/package.json ./
RUN yarn install

COPY ./artifacts/sanity-runner-service.tgz sanity-runner-service.tgz
RUN yarn add sanity-runner-service@file:sanity-runner-service.tgz

CMD ["node_modules/sanity-runner-service/bundle/handler.handler"]
