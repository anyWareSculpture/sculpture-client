const {DefaultConfig} = require('@anyware/game-logic');

const config = Object.assign({}, DefaultConfig);
export default config;

config.username = "sculpture0";

config.HARDWARE_USERNAME_MAPPINGS = {
  sculpture0: '0',
  sculpture1: '1',
  sculpture2: '2'
};

// Serial port paths matching these patterns will be ignored
config.HARDWARE_INVALID_PATH_PATTERNS = [
  "Bluetooth",
  "WirelessiAP"
];

config.HARDWARE_VENDOR_IDS = new Set([
  "0x2341", // Arduino Vendor ID
  "0x16c0"  // Teensy Vendor ID
]);

config.SERIAL_BAUDRATE = 115200;

