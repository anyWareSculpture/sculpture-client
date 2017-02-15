#!/bin/sh

ssh pi@sculpture1.local sudo reboot &
ssh pi@sculpture2.local sudo reboot &
ssh pi@sculpture3.local sudo reboot &
