FROM node:10.20.1-slim

RUN sed '/jessie-updates/d' -i /etc/apt/sources.list
RUN apt-get update && \
    apt-get install -yq python-pip jq git unzip && \
    pip install awscli
