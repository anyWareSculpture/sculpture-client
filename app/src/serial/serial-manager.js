import events from 'events';
import serialport from 'browser-serialport';
import SerialPort from './serial-port';

import * as SerialProtocol from './serial-protocol';

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
  /**
   * Fired when the serial manager finished creating and initializing a port
   * Arguments for handler: SerialPort object
   * @event SerialManager.PORT_CREATED
   */
  static PORT_CREATED = "created";
  /**
   * Fired if the serial manager fails to open or initialize a port
   * Arguments for handler: error object
   * @event SerialManager.PORT_ERROR
   */
  static PORT_ERROR = "error";
  /**
   * Fired when the serial manager finalizes searching for serial ports.
   * This will always be called _once_.
   * Arguments for handler: Error object or undefined
   * @event SerialManager.SEARCH_COMPLETE
   */
  static SEARCH_COMPLETE = "complete";

  constructor(serialConfig) {
    super();

    this.config = serialConfig;

    this.patterns = {}; // { patternRegexp: [portIds..] }
    this.ports = {};

    this.commandQueue = [];
    this._setupCommandQueueProcessor();
  }

  /**
   * Dispatches the given command string to the appropriate serial ports.
   * @param {String} command - The command to dispatch
   * @returns {Boolean} Returns true if the command was dispatched to any port.
   */
  dispatchCommand(command) {
    const targetPorts = this.findTargetPorts(command);

    for (const portId of targetPorts) {
      const port = this.ports[portId];
      this.commandQueue.unshift([port, command]);
    }

    if (targetPorts.size > 0) {
//      this._debug(`Queued command "${command.trim()}" for: ${Array.from(targetPorts)} (queue: ${this.commandQueue.length})`);
    }
    else {
      console.warn(`No destination port for command "${command.trim()}"`);
    }

    return targetPorts.size > 0;
  }

  findTargetPorts(command) {
    const targetPorts = new Set();
    if (command) {
      for (const pattern of Object.keys(this.patterns)) {
        if (new RegExp(pattern).test(command)) {
          for (const portId of this.patterns[pattern]) {
            targetPorts.add(portId);
          }
        }
      }
    }
    return targetPorts;
  }

  /**
   * Goes through all serial ports searching for valid connections
   */
  searchPorts() {
    serialport.list((err, ports) => {
      if (err) return this.emit(SerialManager.SEARCH_COMPLETE, err);
      if (ports.length === 0) return this.emit(SerialManager.SEARCH_COMPLETE, new Error('No serial ports found'));

      // FIXME: Rewrite to using promises
      let remaining = ports.length;

      ports.forEach((portInfo) => {
        if (this._isValidPort(portInfo)) {
          console.log(`Found compatible port: ${portInfo.comName} ${portInfo.manufacturer} ${portInfo.vendorId}`);
          const portPath = portInfo.comName;

          this._createSerialPort(portPath, (error, port) => {
            remaining -= 1;

            if (error) this.emit(SerialManager.PORT_ERROR, error);
            else this.emit(SerialManager.PORT_CREATED, port);

            // If every item is true
            if (remaining === 0) this.emit(SerialManager.SEARCH_COMPLETE);
          });
        }
        else {
          this.emit(SerialManager.PORT_ERROR,
                      new Error(`Skipping incompatible port: ${portInfo.comName} ${portInfo.manufacturer} ${portInfo.vendorId}`));
          remaining -= 1;
          if (remaining === 0) this.emit(SerialManager.SEARCH_COMPLETE);
        }
      });
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
    for (const pattern of this.config.HARDWARE_INVALID_PATH_PATTERNS) {
      const regex = new RegExp(pattern);
      if (regex.test(path)) {
        return true;
      }
    }
    return false;
  }

  _createSerialPort(serialPortPath, callback) {
    const port = new SerialPort(this.config, serialPortPath, {
      baudrate: this.config.BAUDRATE
    });
    port.initialize((error) => {
      if (error) {
        console.warn(`ERROR: Failed to open serial port ${port.path}: ${error.message}`);
      }
      else {
        this._addPortPatterns(port);
        console.log(`Successfully initialized serial port ${port.path}`);
      }
      callback(error, port);
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

  printPatterns() {
    for (let key of Object.keys(this.patterns)) {
      console.log(`  ${key}: ${this.patterns[key].join(' ')}`);
    }
  }

  _handleCommand(port, commandName, commandData) {
    if (commandName === SerialProtocol.DEBUG_COMMAND) {
      console.log(`DEBUG ${port.path}: ${commandData.message}`);
      return;
    }
//    this._debug(`Received command "${commandName}": ${JSON.stringify(commandData)} from "${port.path}"`);

    this.emit(SerialManager.EVENT_COMMAND, commandName, commandData);
  }

  _debug(message) {
    console.log(message);
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
