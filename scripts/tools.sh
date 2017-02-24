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

# $1 - sculptureId
publish() {
    scp build/manifest.json build/application.* pi@${1}.local:build
}

# $1 - build-name sculptureId
version() {
    ssh pi@${2}.local cp -R builds/${1}/* build
}

# Args:
#   operation <start|stop|restart|reboot|halt|publish|version>
#   [operation args]
#   sculptureId
anyware() {
    op=$1
    shift

    case $op in
        start)
            ;;
        stop)
            ;;
        restart)
            ;;
        reboot)
            ;;
        halt)
            ;;
        publish)
            ;;
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
            publish)
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
