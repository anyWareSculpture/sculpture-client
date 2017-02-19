import DefaultConfig from 'anyware/lib/game-logic/config/default-config';
import Disk from 'anyware/lib/game-logic/utils/disk';
import GAMES from 'anyware/lib/game-logic/constants/games';

class Config extends DefaultConfig {
  constructor() {
    super();

    this.SINGLE_USER_MODE = false;
    this.CLIENT_CONNECTION_OPTIONS = {
      default: {
        protocol: "ws",
        username: "anyware",
        password: "anyware",
        host: "broker.shiftr.io"
      }
    };

    /*********** Hardware Mappings ************/
    this.SERIAL = {
      COMMAND_DELIMETER: "\n",
      BAUDRATE: 115200,
      HANDSHAKE: {
        // The number of attempts to make towards getting a valid HELLO command
        HELLO_ATTEMPTS: 100,
        // The time to wait for a valid HELLO
        // Measurements show that it takes 1700-1800 ms to get a HELLO from an
        // Arduino after reset (tested on a Mac)
        TIMEOUT: 5000 // ms
      },
      // Serial port paths matching these patterns will be ignored
      HARDWARE_INVALID_PATH_PATTERNS: [
        "Bluetooth",
        "WirelessiAP"
      ],
      HARDWARE_VENDOR_IDS: new Set([
        "0x0",    // Generic/Unspecified (for Macs)
        "0x2341", // Arduino Vendor ID
        "0x2a03", // Arduino Uno (Alternate) Vendor ID
        "0x16c0"  // Teensy Vendor ID
      ])
    };

    /********* View Configuration *********/
    this.HANDSHAKE_HARDWARE = {
      // Delay between consequtive pulses in the handshake game
      PULSE_DELAY: 4000, // ms
      LOCATION_PANELS: {
        // sculptureId : panelId
        [this.sculpture1]: '0',
        [this.sculpture2]: '1',
        [this.sculpture3]: '2'
      },
      LOCATION_PANEL_ON_INTENSITY: 100,
      LOCATION_PANEL_OFF_INTENSITY: 0,
      LOCATION_PANEL_ON_EASING: 'easein',
      LOCATION_PANEL_OFF_EASING: 'easein',

      MIDDLE_PANEL: '3',
      // Settings for the middle part of the handshake
      MIDDLE_ON_INTENSITY: 100,
      MIDDLE_OFF_INTENSITY: 0,
      // The color settings here represent the color of the middle
      // setting ON_COLOR to null makes it default to the location color
      MIDDLE_ON_COLOR: null,
      MIDDLE_OFF_COLOR: 'white',
      MIDDLE_ON_EASING: 'easein',
      MIDDLE_OFF_EASING: 'easein'
    };

    this.diskUrls = {
      disk0: '/images/disk0.png',
      disk1: '/images/disk1.png',
      disk2: '/images/disk2.png'
    };

    this.projectionParameters = {
      scale: 0.89,
      translate: [5, 6],
    };
  }
}

export default new Config();
