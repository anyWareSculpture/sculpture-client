const events = require('events');

const serialport = require('serialport');
const SerialPort = serialport.SerialPort;

const serialProtocol = require('./serial-protocol');
const {SerialProtocolCommandParser, SerialProtocolCommandBuilder} = serialProtocol;

const MAX_INITIALIZATION_ATTEMPTS = 2;

// NOTE: In order to account for the limited buffer size on the Arduino, many
// serial commands are not sent at once. Instead, each command to be sent
// is buffered and then sent after the following delay. This has a downside
// where if this delay is too large, a large backlog of commands may build
// up. The queue's processing speed is limited by how busy the JavaScript
// engine is. A delay that is too small may not be respected.
const DELAY_BETWEEN_SERIAL_COMMANDS = 10; // ms

/**
   Finds all available serial ports which supports the anyWare protocol.
   Maps supported commands, and routes these to the appropriate serial port.
*/
export default class SerialManager extends events.EventEmitter {
  /**
   * Fired when the serial manager receives a command from a serial port
   * Arguments for handler: [commandName, commandData]
   * @event SerialManager.EVENT_COMMAND
   */
  static EVENT_COMMAND = "command";

  constructor(config, identity) {
    super();

    this.config = config;
    this.identity = identity;

    this.patterns = {};
    this.ports = {};

    this.commandQueue = [];
    this._setupCommandQueueProcessor();

    this._setupConnections();
  }

  /**
   * Dispatches the given command string to the appropriate serial ports.
   * @param {String} command - The command to dispatch
   * @returns {Boolean} Returns true if the command was dispatched to any port.
   */
  dispatchCommand(command) {
    if (!command) {
      return false;
    }

    const targetPorts = new Set();
    for (let pattern of Object.keys(this.patterns)) {
      const regex = new RegExp(pattern);
      const portIds = this.patterns[pattern];
      if (regex.test(command)) {
        for (let portId of portIds) {
          targetPorts.add(portId);
        }
      }
    }

    for (let portId of targetPorts) {
      const port = this.ports[portId];
      this.commandQueue.unshift([port, command]);
    }

    console.log(`Sent command "${command.trim()}" to: ${Array.from(targetPorts)}`);

    return targetPorts.size !== 0;
  }

  _setupConnections() {
    serialport.list((err, ports) => {
      if (err) {
        console.error(err);
        return;
      }
      ports.forEach((portInfo) => {
        if (this._isValidPort(portInfo)) {
          console.log(`Found compatible port: ${portInfo.comName} ${portInfo.manufacturer} ${portInfo.vendorId}`);
          const portPath = portInfo.comName;
          this._createSerialPort(portPath);
        }
        else {
          console.log(`Skipping incompatible port: ${portInfo.comName} ${portInfo.manufacturer} ${portInfo.vendorId}`);
        }
      });
    });
  }

  _isValidPort(portInfo) {
    if (!this.config.HARDWARE_VENDOR_IDS.has(portInfo.vendorId)) {
      return false;
    }

    return true;
  }

  _createSerialPort(serialPortPath) {
    const port = new SerialPort(serialPortPath, {
      baudrate: this.config.SERIAL_BAUDRATE
    });
    port.initialize((error) => {
      if (error) {
        console.warn(`ERROR: Failed to open serial port ${port.path}`);
        console.warn(error);
      }
      else {
        console.log(`Successfully initialized serial port ${port.path}`);
      }
    });
    port.on(SerialPort.EVENT_COMMAND, this._handleCommand.bind(this));
    port.on(SerialPort.EVENT_ERROR, this._handleError.bind(this));
  }

  _handleCommand(commandName, commandData) {
    if (commandName === serialProtocol.DEBUG_COMMAND) {
      console.log(`DEBUG: ${commandData.message}`);
      return;
    }

    this.emit(SerialManager.EVENT_COMMAND, commandName, commandData);
  }

  _handleError(error) {
    console.error(`ERROR: ${error}`);
  }

  _setupCommandQueueProcessor() {
    setInterval(() => {
      if (this.commandQueue.length === 0) {
        return;
      }

      const [port, command] = this.commandQueue.pop();
      port.write(command);
    }, DELAY_BETWEEN_SERIAL_COMMANDS);
  }
}
