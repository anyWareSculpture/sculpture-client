const DefaultConfig = require('@anyware/game-logic/lib/config/default-config');

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
      sculpture0: '0',
      sculpture1: '1',
      sculpture2: '2'
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

    this.SERIAL_BAUDRATE = 115200;
  }
}
