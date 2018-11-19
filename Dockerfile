FROM node:8.10.0-slim

RUN apt-get update && \
    apt-get install -yq python-pip jq git && \
    pip install awscli
