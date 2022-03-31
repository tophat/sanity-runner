# Use aws lambda base image
FROM public.ecr.aws/lambda/nodejs:14

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Install system dependencies
RUN yum install -y git make gcc gcc-c++ && \
    corepack enable

CMD ["service/dist/lambdaHandler.handler"]
