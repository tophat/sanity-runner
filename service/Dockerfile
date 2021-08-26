# Use aws lambda base image
FROM public.ecr.aws/lambda/nodejs:10

# Install system dependencies
RUN yum install -y git make gcc gcc-c++

# Install yarn
RUN npm install -g yarn

# Copy source files
COPY package.json ./package.json
COPY yarn.lock ./yarn.lock
COPY src ./src

# Install package dependencies
RUN yarn install

CMD ["src/lambdaHandler.handler"]
