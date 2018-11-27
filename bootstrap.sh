#!/bin/bash -x 

BUILD_DIR=/tmp/root/workspace/service/artifacts/build/
CUR_DIR=`pwd`
export SERVERLESS_TAG=`aws configure get aws_access_key_id | tr "[:upper:]" "[:lower:]" `
REPLACE_TAG=dev-$SERVERLESS_TAG
CHROME_VERSION=1.0.0-55

# PARSE ARGUMENTS 
while getopts "v:p:" OPTION
do
	case $OPTION in
		v)
			VERSION=$OPTARG
            ;;
        p)
            BIN_PATH=$OPTARG/sanity-runner
            echo "$BIN_PATH"
            ;;
	esac
done

# Get OS
if [ "$(uname)" == "Darwin" ]; then
    OS=macos
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
    OS=linux
fi

# Get Default VERSION (latest release)
if [ -z $VERSION ]
then
VERSION=`curl --silent "https://api.github.com/repos/tophat/sanity-runner/releases/latest" | curl --silent "https://api.github.com/repos/tophat/sanity-runner/releases/latest" | sed -n -e '/"tag_name":/ s/^.*"\(.*\)".*/\1/p'`
VERSION_STRIPPED=`echo $VERSION | cut -d "v" -f 2`

else
    VERSION=v$VERSION
    VERSION_STRIPPED=$VERSION
fi

# Get Bin Path
if [ -z $BIN_PATH ]
then
BIN_PATH=/usr/local/bin/sanity-runner
fi

# get client binary
curl -L https://github.com/tophat/sanity-runner/releases/download/$VERSION/sanity-runner-$OS --output $BIN_PATH; chmod 770 $BIN_PATH

# get serverless
curl -L https://github.com/tophat/sanity-runner/releases/download/$VERSION/sanity-runner-serverless-$VERSION_STRIPPED.tar --output /tmp/sanity-runner-serverless-$VERSION_STRIPPED.tar;
curl -L https://github.com/adieuadieu/serverless-chrome/releases/download/v$CHROME_VERSION/dev-headless-chromium-amazonlinux-2017-03.zip --output /tmp/HeadlessChromium-$CHROME_VERSION.tar.gz
curl -L https://raw.githubusercontent.com/tophat/sanity-runner/$VERSION/service/serverless.yml --output /tmp/serverless.yml

tar xvf /tmp/sanity-runner-serverless-$VERSION_STRIPPED.tar -C /tmp
cd /tmp;
if [ $OS == "macos"]; then
    sed -i'' -e 's/dev-default/dev-'$REPLACE_TAG'/g' /tmp/root/workspace/service/artifacts/build/*.json
fi
#serverless deploy --package "${BUILD_DIR}"
#aws s3 sync ./chrome s3://${DEFAULT_S3_BUCKET}
#cd $CUR_DIR
# exitgit 
