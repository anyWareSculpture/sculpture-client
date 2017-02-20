#!/bin/sh

# Usage:
#   <operation>        - <start|stop|restart|reboot|halt|publish|version>
#   [<operation args>]
#   [<sculptureId>]    - [sculpture1|sculpture2|sculpture3] - leave empty for all sculptures

DIR="${BASH_SOURCE%/*}"
if [[ ! -d "$DIR" ]]; then DIR="$PWD"; fi
. "$DIR/tools.sh"

if [ $# -lt 1 ]; then
    echo "Usage: $0 <start|stop|restart|reboot|halt|publish|version <build>> [<sculptureId>]"
fi

anyware $@
