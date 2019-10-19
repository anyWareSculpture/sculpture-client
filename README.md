# sculpture-client

The embedded system code for the sculpture itself. This will run as a chrome app.

## Getting started

Dependencies: node.js, npm, Google Chrome

    npm install
    npm run dev

This will launch the dev version locally.

Note: If using local dev versions of libraries:

    npm link anyware
    npm link @anyware/sound-assets

## Build and run release version for sculptures

### Update version

NB! We need to update the version both in package.json and manifest.json

### Build and deploy

    npm run build
    ./scripts/anyware.sh publish [<sculptureId>]

## Serial Emulator (no longer maintained)

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
