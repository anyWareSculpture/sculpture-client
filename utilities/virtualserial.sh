#!/usr/bin/env bash

echo "INSTRUCTIONS:"
echo "Two serial port paths will be outputted."
echo "One will be used by you to control the"
echo "input/output of your serial device. Let's"
echo "call this one SERIAL_DEVICE."
echo "The other will be used by your program to"
echo "access your virtual serial device. Let's"
echo "call that one PROGRAM."
echo 
read -p "Press [Enter] key to continue..."

echo "Open two more terminal windows."
echo 
echo "Use:"
echo "    cat > SERIAL_DEVICE"
echo "to write input to your program through"
echo "your serial device."
echo 
echo "Use:"
echo "    cat SERIAL_DEVICE"
echo "to read serial written from your program"
echo
read -p "Press [Enter] key to continue..."

echo "Pass PROGRAM to your program so it can read"
echo "and write to that path in order to access"
echo "your new virtual serial device"
echo
read -p "Press [Enter] key to begin..."

echo 
echo "Press Ctrl-C to quit"
sudo socat -d -d pty,raw,echo=0,link=/dev/ttyS10 pty,raw,echo=0,link=/dev/ttyS11
