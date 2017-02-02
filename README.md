# sculpture-client
The embedded system code for the sculpture itself. This will run as a chrome app.

## Getting started

Dependencies: node.js, npm, Google Chrome

   npm install
   npm run dev

## Building, Packaging, & Launching the app

Build the app into the build/ directory:

    npm run build

Package as a Chrome packaged app (dist/anyware-sculpture.zip)

    npm run package

Other targets:

* Launch without rebuild: `npm run launch`


## Serial Emulator

To test the sculpture client without a sculpture, we have a serial emulator which emulates basic behavior of the microcontrollers over virtual serial ports.

### Curses interface

The emulator has a curses interface where serial commands from the
microcontrollers can be entered.  It will automatically respond to
`HELLO` messages, but any user input has to be entered by hand.  The
four ports opened (A, B, C, and M) corresponds to the strips and main
(handshake) microcontroller. These can be activated by pressing
F1-F4. When activated, input is sent over the corresponding serial
port.

To use:

* Configuration:
   * Set baud rate to 38400
   * Make sure an initial HELLO is sent in serial-handshake
* Run `./utilities/serial-emulator.js`
 

## Publish Chrome App

* Make sure manifest.json has a bumped version number
* ```npm run build```
* ```npm run package```
* Login to https://chrome.google.com/webstore/developer/dashboard
* ..using anyware.sculpture@gmail.com
* anyWare Sculpture -> edit -> Upload Updated package
* Choose file: dist/anyware-sculpture.zip -> Upload
* Click "Publish Changes"

## Using Chrome App

* Click on Apps -> "anyWare Sculpture"
* To update fast:
    * chrome://extensions/
    * -> Update extensions now
    * Wait & verify that version number increased
