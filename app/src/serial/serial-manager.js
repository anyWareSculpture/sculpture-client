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
  // Emitted when a pattern was found during port search
  static PATTERNS_FOUND = "patterns";
  // Emitted when we're done searching all compatible ports
  static PORTS_SEARCHED = "searched";
  /**
   * Fired when the serial manager receives a command from a serial port
   * Arguments for handler: [commandName, commandData]
   * @event SerialManager.EVENT_COMMAND
   */
  static EVENT_COMMAND = "command";

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
      this._debug(`Queued command "${command.trim()}" for: ${Array.from(targetPorts)} (queue: ${this.commandQueue.length})`);
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

  _findCompatiblePorts(callback) {
    serialport.list((err, ports) => {
      if (err) return callback(err);
      callback(null, ports.filter((portInfo) => {
        if (this._isValidPort(portInfo)) {
          console.log(`Found compatible port: ${portInfo.comName} ${portInfo.manufacturer} ${portInfo.vendorId}`);
          return portInfo;
        }
        else {
          console.log(`Skipping incompatible port: ${portInfo.comName} ${portInfo.manufacturer} ${portInfo.vendorId}`);
        }
      }));
    });
  }

  /**
   * Goes through all serial ports searching for valid connections.
   * Emits PORTS_SEARCHED when all ports are searched
   */
  searchPorts() {
    // FIXME: Should we also check for new serial ports, to allow hot-plugging?
    if (!this._remainingPorts) {
      this._findCompatiblePorts((err, ports) => {
        if (err) return console.error(err);
        this._remainingPorts = {};
        for (let portInfo of ports) this._remainingPorts[portInfo.comName] = portInfo;
        this._searchRemainingPorts();
      });
    }
    else {
      this._searchRemainingPorts();
    }
  }

  get requiredPatternsFound() {
    return false;
  }

  _searchRemainingPorts() {
    const done = Array(Object.keys(this._remainingPorts).length).fill(false);
    Object.keys(this._remainingPorts).forEach((portPath, index) => {
      this._createSerialPort(portPath, (err, port) => {
        if (!err) {
          port.on(SerialPort.EVENT_COMMAND, (commandName, commandData) => this._handleCommand(port, commandName, commandData));
          port.on(SerialPort.EVENT_ERROR, this._handleError.bind(this));
          // FIXME: If we've got both tty and cu port, remove the "sister" port?
          delete this._remainingPorts[portPath];
        }
        // FIXME: else if this is not a timeout, remove from remainingPorts

        done[index] = true;
        // If every item is true
        if (done.every((d) => d)) {
          console.debug(`Remaining ports: ${Object.keys(this._remainingPorts).join(' ')}`);
          this.emit(SerialManager.PORTS_SEARCHED);
        }
      });
    });

    if (!done.length) {
      console.debug("No serial ports connected");
      this.emit(SerialManager.PORTS_SEARCHED);
    }
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
        port.close();
        console.warn(`ERROR: Failed to open serial port ${port.path}: ${error.message}`);
      }
      else {
        this._addPortPatterns(port);
        console.log(`Successfully initialized serial port ${port.path}`);
      }
      callback(error, port);
    });
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
    this.emit(SerialManager.PATTERNS_FOUND, port.supportedPatterns);
  }

  _handleCommand(port, commandName, commandData) {
    if (commandName === SerialProtocol.DEBUG_COMMAND) {
      console.log(`DEBUG ${port.path}: ${commandData.message}`);
      return;
    }
    this._debug(`Received command "${commandName}": ${JSON.stringify(commandData)} from "${port.path}"`);

    this.emit(SerialManager.EVENT_COMMAND, commandName, commandData);
  }

  _debug(message) {
//    console.log(message);
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
