#!/bin/sh

ssh pi@sculpture1.local systemctl --user restart anyware.service &
ssh pi@sculpture2.local systemctl --user restart anyware.service &
ssh pi@sculpture3.local systemctl --user restart anyware.service &
