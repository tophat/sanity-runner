#!/bin/bash

# Constants
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../.."
DESIRED_NODE_VERSION="$(cat $ROOT_DIR/.nvmrc)"
NODE_VERSION=$(node --version)

# Don't run during CI
if [[ -n $CI ]]; then
    exit 0
fi

if [ "$NODE_VERSION" != "${DESIRED_NODE_VERSION}" ];
then
    echo -e "${RED}Node version is ${NODE_VERSION}. Please use the exact version ${DESIRED_NODE_VERSION} by running:"
    echo -e "${YELLOW}>>> nvm use${NC}"
    exit 1
fi
