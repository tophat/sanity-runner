#!/bin/bash -x 

################
### SET DEFAULTS
################
_set_defaults(){
    CUR_DIR=$(pwd)
    CHROME_VERSION=1.0.0-55
    TMP_DIR=/tmp/sanity-bootstrap
}
_set_defaults

################
### GENERATE TMP
################
_generate_tmp(){
    mkdir -p $TMP_DIR
}
_generate_tmp

################
### CLEAN UP TMP
################
_clean_tmp(){
    rm -rf $TMP_DIR
}

#################
### EXIT COMMANDS
#################
function _exit_cmd {
    _clean_tmp
    cd "$CUR_DIR" || exit 1
}

###################
### TRAP EXIT CODES
###################

#trap _exit_cmd EXIT
#trap _exit_cmd ERR

###################
### PARSE ARGUMENTS
################### 

while getopts "chsv:p:" OPTION
do
    case $OPTION in
        v)
            VERSION=$OPTARG
            ;;
        p)
            DEPLOY_PATH=$OPTARG
            ;;
        c) 
            ONLY_CLIENT="true"
            ;;
        s) 
            ONLY_SERVERLESS="true"
            ;;
        h)
            echo "-v <version> : VERSION TO INSTALL"
            echo "-p <path> : Path to Installation Locaiton for Client"
            echo "-c : Install Client Only"
            echo "-h : help"
            exit 1
            ;;
        *)
            echo "Invalid Flag. Use -h to see all valid flags"
            ;;
    esac
done


################
### CONFIRM AWS
################
_confirm_aws(){
    if [ -z $ONLY_CLIENT ]; then
        if ! aws sts get-caller-identity > /dev/null; then
            echo "Please export AWS credentials"
            exit 1
        fi
    fi
}
_confirm_aws

###############
### GET OS INFO
###############
_get_os() {
    OS_NAME=$(uname -s)
    OS_VERSION=$(uname -r)

    if [ "$OS_NAME" == "Darwin" ]; then
        OS_GENERNIC_NAME=macos
        PACKAGE_INSTALLER=brew

    elif [ "$OS_NAME" == "Linux" ]; then
        OS_GENERNIC_NAME=linux
        
    fi
}
_get_os

###############
### GET VERSION
###############
_get_version (){
    if [ -z "$VERSION" ]
    then
        VERSION=$(curl --silent "https://api.github.com/repos/tophat/sanity-runner/releases/latest" | sed -n -e '/"tag_name":/ s/^.*"\(.*\)".*/\1/p')
    fi
    VERSION_STRIPPED=$(echo "$VERSION" | cut -d "v" -f 2)
}
_get_version

####################
### GET DEPLOY PATH
####################
_get_deploy_path(){
    if [ -z "$BIN_PATH" ]
    then
        DEPLOY_PATH=/usr/local/bin
    fi
}

cd $TMP_DIR || exit 1

#####################
### GET CLIENT BINARY
#####################
_get_client_binary (){
    CLIENT_FILENAME=sanity-runner-$OS_GENERNIC_NAME
    wget https://github.com/tophat/sanity-runner/releases/download/"$VERSION"/"$CLIENT_FILENAME"
    chmod 755 $CLIENT_FILENAME
    mv $CLIENT_FILENAME $DEPLOY_PATH
}

if [ -z $ONLY_SERVERLESS ]; then
    _get_deploy_path
    _get_client_binary
fi

########################
### GET SERVERLESS FILES
########################
_get_serverless(){
    SERVERLESS_TAR=$(sanity-runner-serverless-"$VERSION_STRIPPED".tar)
    wget https://github.com/tophat/sanity-runner/archive/"$VERSION".tar.gz
    tar xvf "$VERSION".tar.gz
}

########################
### GENERATE SED COMMAND
########################
_gen_sed(){
    echo "OS: $OS_GENERNIC_NAME"
    if [ "$OS_GENERNIC_NAME" == "macos" ]; then
        SED_CMD="sed -i ''"
    fi
}

########################
### CONFIGURE SERVERLESS
########################
_configure_serverless(){
    export SERVERLESS_TAG=$(aws sts get-caller-identity | sed -n -e '/"Account":/ s/^.*"\(.*\)".*/\1/p')
    export SERVERLESS_STAGE="dev"
    export SERVERLESS_FUNC="sanity-runner-dev-default"
}

########################
### BUILD SERVERLESS
########################
_build_serverless(){
    cd sanity-runner-"$VERSION_STRIPPED"/service || exit 1
    if [ $OS_GENERNIC_NAME == "macos" ]; then 
        make install-mac
    else
        make install
    fi
    make package
}

########################
### DEPLOY SERVERLESS
########################
_deploy_serverless(){
    make deploy
}

if [ -z $ONLY_CLIENT ]; then
    _get_serverless
    _configure_serverless
    _build_serverless
    _deploy_serverless
fi


#serverless deploy --package .
#aws s3 sync /tmp/HeadlessChromium-$CHROME_VERSION.tar.gz s3://sr-chrome-$REPLACE_TAG
cd "$CUR_DIR" || exit 1
#exit 