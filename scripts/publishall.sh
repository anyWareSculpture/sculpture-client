#!/bin/sh

scp build/manifest.json build/application.* pi@sculpture1.local:build
scp build/manifest.json build/application.* pi@sculpture2.local:build
scp build/manifest.json build/application.* pi@sculpture3.local:build
ssh pi@sculpture1.local systemctl --user restart anyware.service &
ssh pi@sculpture2.local systemctl --user restart anyware.service &
ssh pi@sculpture3.local systemctl --user restart anyware.service &
