#!/bin/sh

# $1 - <start|stop|restart|reboot|halt|publish>
# $2 - sculptureId

DIR="${BASH_SOURCE%/*}"
if [[ ! -d "$DIR" ]]; then DIR="$PWD"; fi
. "$DIR/tools.sh"

if [ $# -lt 1 ]; then
    echo "Usage: $0 <start|stop|restart|reboot|halt|publish> [<sculptureId>]"
fi

anyware $1 $2
