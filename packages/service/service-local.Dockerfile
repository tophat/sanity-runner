# Use aws lambda base image
FROM public.ecr.aws/lambda/nodejs:16

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Install system dependencies
RUN yum install -y git make gcc gcc-c++ && \
    corepack enable

CMD ["packages/service/bundle/handler.handler"]
