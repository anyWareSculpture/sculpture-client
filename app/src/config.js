const {DefaultConfig} = require('@anyware/game-logic');

const config = Object.assign({}, DefaultConfig);
export default config;

config.username = "sculpture0";

config.HARDWARE_USERNAME_MAPPINGS = {
  sculpture0: '0',
  sculpture1: '1',
  sculpture2: '2'
};

config.CHECK_VENDOR_ID = false; // Chrome on Mac doesn't give us hardware IDs
config.HARDWARE_VENDOR_IDS = new Set([
  "0x2341" // Arduino Vendor ID
]);

// We blacklist serial ports as it takes too long time to open them
config.BLACKLISTED_SERIAL_PORTS = [
  "Bluetooth",
  "WirelessiAP"
];

config.SERIAL_BAUDRATE = 115200;

