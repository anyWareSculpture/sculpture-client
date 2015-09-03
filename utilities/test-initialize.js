if (process.argv.length !== 3) {
  console.error("Please provide a port path as the first argument");
  process.exit(1);
}

let SerialPort = require('../src/serial/serial-port');
let port = new SerialPort(process.argv[2], {baudrate: 115200});

console.log(`isOpen: ${port.isOpen}, isReady: ${port.isReady}`);

console.log('Started Initialization...');
port.initialize("0", (error) => {
  if (error) {
    console.warn(`ERROR: Failed to open serial port ${port.path}`);
    console.warn(error);
  }
  else {
    console.log(`Successfully initialized serial port ${port.path}`);

    console.log("Supported patterns:");
    console.log(port.supportedPatterns);

    console.log(`isOpen: ${port.isOpen}, isReady: ${port.isReady}`);
  }
});
port.on(SerialPort.EVENT_COMMAND, (name, data) => {
  console.log(`Got command '${name}' with data ${JSON.stringify(data)}`);
});
port.on(SerialPort.EVENT_ERROR, (error) => {
  console.error(error);
});


