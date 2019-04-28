import DefaultConfig from 'anyware/lib/game-logic/config/default-config';
import Disk from 'anyware/lib/game-logic/utils/disk';
import GAMES from 'anyware/lib/game-logic/constants/games';

const production = process.env.NODE_ENV === 'production';
console.log(`Built for ${production ? 'production' : 'development'}`);

class Config extends DefaultConfig {
  constructor() {
    super();

    this.DEBUG.status = !production;

    this.SINGLE_USER_MODE = false;
    this.CLIENT_CONNECTION_OPTIONS = {
      default: {
        username: "anyware",
        password: "anyware",
        protocol: "wss",
        host: "broker.shiftr.io"
//        host: "excellent-model.cloudmqtt.com",
      },
      credentials: {
        sculpture1: '3ca778a7d51ac0ea4717d09ea7e97150',
        sculpture2: '72d90e9afadc2f055fe5477aebd0616b',
        sculpture3: '7f24a3e73b91dc9f51f15861d75c888a',
        anyware: 'anyware',
      },
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
        "WirelessiAP",
        "ctrl"
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
