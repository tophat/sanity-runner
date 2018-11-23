#!/bin/bash -x

if ! type -p jq &>/dev/null; then
    echo "Could not find dependency 'jq'. Aborting."
    exit 1
fi

if [ -z $SERVERLESS_CHROME_VERSION ]
then
SERVERLESS_CHROME_VERSION=v1.0.0-55
fi

if [ $OUTPUT_DIR ]
then
cd $OUTPUT_DIR
fi

DOWNLOAD_URL=`curl --silent https://api.github.com/repos/adieuadieu/serverless-chrome/releases/tags/${SERVERLESS_CHROME_VERSION} | jq -r '.assets[] | select(.name | startswith("stable")) | .browser_download_url'`
echo "Downloading from URL: ${DOWLOAD_URL}"
curl -L $DOWNLOAD_URL --output serverless_chromium.zip

unzip serverless_chromium.zip

tar -cvzf HeadlessChromium-${SERVERLESS_CHROME_VERSION}.tar.gz headless-chromium
rm headless-chromium serverless_chromium.zip
