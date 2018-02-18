#!/bin/bash

# $1 - sculptureId
start() {
    ssh pi@${1}.local systemctl --user start anyware.service &
}

# $1 - sculptureId
stop() {
    ssh pi@${1}.local systemctl --user stop anyware.service &
}

# $1 - sculptureId
restart() {
    ssh pi@${1}.local systemctl --user restart anyware.service &
}

# $1 - sculptureId
reboot() {
    ssh pi@${1}.local sudo reboot &
}

# $1 - sculptureId
halt() {
    ssh pi@${1}.local sudo halt &
}

# $1 - config file
# $2 - sculptureId
config() {
    scp "$1" pi@${2}.local:build/config.js
}

# $1 - what
# $2 - sculptureId
get() {
    case $1 in
        config)
	    dest=config-$2.js
	    scp pi@${2}.local:build/config.js $dest
	    echo "Saved as $dest"
	    ;;
        *)
            echo "Unknown get '$$1'"
            ;;
    esac
}

# $1 - what
# $2 - sculptureId
clear() {
    case $1 in
        config)
	    ssh pi@${2}.local 'echo "anyware_config = {}" > build/config.js'
	    ;;
        *)
            echo "Unknown get '$$1'"
            ;;
    esac
}

# $1 - sculptureId
publish() {
    scp build/manifest.json build/application.* build/vendor.js* pi@${1}.local:build
}

# $1 - sculptureId
fullpublish() {
    scp -r build/* pi@${1}.local:build
}

# $1 - build-name
# $2 - sculptureId
version() {
    ssh pi@${2}.local cp -R builds/${1}/* build
}

# Args:
#   operation <start|stop|restart|reboot|halt|publish|fullpublish|version>
#   [operation args]
#   sculptureId
do_anyware() {
    op=$1
    shift

    case $op in
        start) ;;
        stop) ;;
        restart) ;;
        reboot) ;;
        halt) ;;
        get|clear)
             what=$1
             shift
            ;;
        config)
             config=$1
             shift
            ;;
        publish) ;;
        fullpublish) ;;
        version)
             build=$1
             shift
            ;;
        *)
            echo "Unknown operation '$op'"
            op=""
            return
            ;;
    esac

    if [ -z "$1" ]; then
        sculptures="sculpture1 sculpture2 sculpture3"
    else
        sculptures=$1
    fi
    for sculpture in $sculptures; do
        echo "$op: $sculpture"
        case $op in
            get)
                $op $what $sculpture
                ;;
            clear)
                $op $what $sculpture
                restart $sculpture
                ;;
            config)
                $op $config $sculpture
                restart $sculpture
                ;;
            publish|fullpublish)
                $op $sculpture
                restart $sculpture
                ;;
            version)
                $op $build $sculpture
                restart $sculpture
                ;;
            *)
                $op $sculpture
                ;;
        esac
    done
}
