const events = require('events');

const serialport = require('browser-serialport');
const SerialPort = require('./serial-port');

const serialProtocol = require('./serial-protocol');

/**
 * Finds all available serial ports which supports the anyWare protocol.
 * Maps supported commands, and routes these to the appropriate serial port.
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
      port.write(command);
    }

    if (targetPorts.size > 0) {
      console.log(`Sent command "${command.trim()}" to: ${Array.from(targetPorts)}`);
    }
    else {
      console.warn(`No destination port for command "${command.trim()}"`);
    }

    return targetPorts.size !== 0;
  }

  /**
   * Goes through all serial ports searching for valid connections
   * @param {Function} callback - The callback to call once all possible connections have been searched
   */
  searchPorts(callback) {
    serialport.list((err, ports) => {
      if (err) {
        console.error(err);
        return;
      }
      const done = [];
      for (let i = 0; i < ports.length; i++) {
        done.push(false);
      }

      ports.forEach((portInfo, index) => {
        if (this._isValidPort(portInfo)) {
          console.log(`Found compatible port: ${portInfo.comName} ${portInfo.manufacturer} ${portInfo.vendorId}`);
          const portPath = portInfo.comName;

          this._createSerialPort(portPath, () => {
            done[index] = true;

            // If every item is true
            if (done.every((d) => d)) {
              callback();
            }
          });
        }
        else {
          console.log(`Skipping incompatible port: ${portInfo.comName} ${portInfo.manufacturer} ${portInfo.vendorId}`);
          done[index] = true;
        }
      });

      if (!done.length) {
        console.debug("No serial ports connected");
        callback();
      }
    });
  }

  _isValidPort(portInfo) {
    if (portInfo.vendorId !== undefined && !this.config.HARDWARE_VENDOR_IDS.has(portInfo.vendorId)) {
      return false;
    }

    const portPath = portInfo.comName;
    if (this._isInvalidPortPath(portPath)) {
      return false;
    }

    return true;
  }

  _isInvalidPortPath(path) {
    for (let pattern of this.config.HARDWARE_INVALID_PATH_PATTERNS) {
      var regex = new RegExp(pattern);
      if (regex.test(path)) {
        return true;
      }
    }
    return false;
  }

  _createSerialPort(serialPortPath, callback) {
    const port = new SerialPort(this.config.SERIAL, serialPortPath, {
      baudrate: this.config.SERIAL.BAUDRATE
    });
    port.initialize(this.identity, (error) => {
      if (error) {
        console.warn(`ERROR: Failed to open serial port ${port.path}: ${error.message}`);
      }
      else {
        this._addPortPatterns(port);
        console.log(`Successfully initialized serial port ${port.path}`);
      }
      callback(error);
    });
    port.on(SerialPort.EVENT_COMMAND, (commandName, commandData) => this._handleCommand(port, commandName, commandData));
    port.on(SerialPort.EVENT_ERROR, this._handleError.bind(this));
  }

  _addPortPatterns(port) {
    const portId = port.path;

    this.ports[portId] = port;
    for (let pattern of port.supportedPatterns) {
      pattern = pattern.trim();
      if (!this.patterns[pattern]) {
        this.patterns[pattern] = [];
      }

      this.patterns[pattern].push(portId);
    }
  }

  _handleCommand(port, commandName, commandData) {
    if (commandName === serialProtocol.DEBUG_COMMAND) {
      console.log(`DEBUG ${port.path}: ${commandData.message}`);
      return;
    }
    console.log(`Received command "${commandName}": ${JSON.stringify(commandData)} from "${port.path}"`);

    this.emit(SerialManager.EVENT_COMMAND, commandName, commandData);
  }

  _handleError(error) {
    console.error(`ERROR: ${error}`);
  }
}
