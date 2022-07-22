# Use aws lambda base image
FROM public.ecr.aws/lambda/nodejs:16 as base

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Install system dependencies
RUN yum install -y git make gcc gcc-c++ tar && \
    corepack enable

COPY ./docker/.yarnrc.yml ./docker/package.json ./
RUN yarn install

COPY ./artifacts/sanity-runner-service.tgz sanity-runner-service.tgz
RUN yarn add sanity-runner-service@file:sanity-runner-service.tgz

CMD ["node_modules/sanity-runner-service/bundle/handler.handler"]

FROM base as datadog
COPY --from=public.ecr.aws/datadog/lambda-extension:24 /opt/extensions/ /opt/extensions
RUN yarn add datadog-lambda-js@6.81.0 dd-trace@2.11.0
ENV DD_LAMBDA_HANDLER=node_modules/sanity-runner-service/bundle/handler.handler
CMD ["node_modules/datadog-lambda-js/dist/handler.handler"]
