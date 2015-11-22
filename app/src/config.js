const DefaultConfig = require('@anyware/game-logic/lib/config/default-config');
const Disk = require('@anyware/game-logic/lib/utils/disk');

export default class Config extends DefaultConfig {
  constructor() {
    super();

    this.username = "sculpture0";
    this.CLIENT_CONNECTION_OPTIONS = {
      default: {
        protocol: "ws",
        username: "anyware",
        password: "anyware",
        host: "broker.shiftr.io"
      }
    };

    this.HARDWARE_USERNAME_MAPPINGS = {
      [this.user0]: '0',
      [this.user1]: '1',
      [this.user2]: '2'
    };

    // Serial port paths matching these patterns will be ignored
    this.HARDWARE_INVALID_PATH_PATTERNS = [
      "Bluetooth",
      "WirelessiAP"
    ];

    this.HARDWARE_VENDOR_IDS = new Set([
      "0x0",    // Generic/Unspecified (for Macs)
      "0x2341", // Arduino Vendor ID
      "0x2a03", // Arduino Uno (Alternate) Vendor ID
      "0x16c0"  // Teensy Vendor ID
    ]);

    this.SERIAL = {
      COMMAND_DELIMETER: "\n",
      BAUDRATE: 115200,
      HANDSHAKE: {
        // The number of attempts to make towards getting a valid HELLO command
        HELLO_ATTEMPTS: 100,
        // The time to wait for a valid HELLO
        // Measurements show that it takes 1700-1800 ms to get a HELLO from an
        // Arduino after reset (tested on a Mac)
        TIMEOUT: 2000 // ms
      }
    };

    /********* View Configuration *********/
    this.DISKS_HARDWARE = {
      MAX_RESET_ATTEMPTS: 5,
      ID_TO_HARDWARE_MAP: {
        disk0: "0",
        disk1: "1",
        disk2: "2"
      },
      DIRECTION_TO_HARDWARE_MAP: {
        [Disk.CLOCKWISE]: -1,
        [Disk.COUNTERCLOCKWISE]: 1,
        [Disk.STOPPED]: 0,
        [Disk.CONFLICT]: 0
      }
    };
  }
}
