#!/bin/sh

scp build/manifest.json build/application.* pi@sculpture1.local:build
scp build/manifest.json build/application.* pi@sculpture2.local:build
scp build/manifest.json build/application.* pi@sculpture3.local:build
./scripts/restartall.sh
