# PARSE ARGUMENTS 
while getopts "vp:" OPTION
do
	case $OPTION in
		v)
			VERSION=$OPTARG
            echo "$VERSION"
        ;;
        p)
            BIN_PATH=$OPTARG/sanity-runner
            echo "$BIN_PATH"
	esac
done

# Get OS
if [ "$(uname)" == "Darwin" ]; then
    OS=macos
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
    OS=linux
fi

# Get Version
if [ -z $VERSION ]
then
VERSION=`curl --silent "https://api.github.com/repos/tophat/sanity-runner/releases/latest" | sed -n -e '/"tag_name":/ s/^.*"\(.*\)".*/\1/p'`
else
VERSION=v$VERSION
fi

# Get Bin Path
if [ -z $BIN_PATH ]
then
BIN_PATH=/usr/local/bin/sanity-runner
fi

#get binary
curl -L https://github.com/tophat/sanity-runner/releases/download/$VERSION/sanity-runner-$OS --output $BIN_PATH; chmod 770 $BIN_PATH
