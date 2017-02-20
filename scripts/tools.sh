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

# $1 - <start|stop|restart|reboot|halt|publish>
# $2 - sculptureId
anyware() {
    op=$1

    if [ -z "$2" ]; then
        sculptures="sculpture1 sculpture2 sculpture3"
    else
        sculptures=$2
    fi
    for sculpture in $sculptures; do
        echo "$op: $sculpture"
        case $op in
            start)
                start $sculpture
                ;;
            stop)
                stop $sculpture
                ;;
            restart)
                restart $sculpture
                ;;
            reboot)
                reboot $sculpture
                ;;
            halt)
                halt $sculpture
                ;;
            publish)
                publish $sculpture
                restart $sculpture
                ;;
        esac
    done
}
