import events from 'events';
import serialport from 'browser-serialport';

import SerialHandshake from './serial-handshake';
import {SerialProtocolCommandParser} from './serial-protocol';

/**
 * A higher-level adapter for serial ports that understands our custom serial protocol
 * Automatically handles the initialization handshake
 */
export default class SerialPort extends events.EventEmitter {
  /**
   * Fired when the serial port receives a complete input line
   * from a serial port
   * Arguments for handler: [commandName, commandData]
   * @event SerialPort.EVENT_COMMAND
   */
  static EVENT_COMMAND = "command";

  /**
   * Fired whenever an error occurs
   * @event SerialPort.EVENT_ERROR
   */
  static EVENT_ERROR = "error";

  constructor(serialConfig, path, portOptions) {
    super();

    this.config = serialConfig;
    this.path = path;
    this.options = portOptions;
    this.supportedPatterns = [];

    this._port = new serialport.SerialPort(path, this.options, false);

    this._buffer = "";

    this._nextCommandHandler = null;
    this._initialized = false;
    this._connectionAttemptsRemaining = 2;
  }

  /**
   * @returns {Boolean} Returns true if the port is open
   */
  get isOpen() {
    return this._port.isOpen();
  }

  /**
   * @returns {Boolean} Returns true if the port is open and ready to send/receive commands
   */
  get isReady() {
    return this.isOpen && this._initialized;
  }

  /**
   * Writes to the serial port
   * @param {String} buffer
   * @param {Function} callback
   */
  write(buffer, callback) {
    return this._port.write(buffer, callback);
  }

  /**
   * Closes the serial port
   * @param {Function} [callback] - The callback function to call once the connection has been closed, should take an error parameter
   */
  close(callback) {
    this._port.close((error, result) => {
      if (typeof callback === 'function') callback(error, result);
    });
  }

  /**
   * Handles the next command with the given function and forces the port
   * to **not** emit a command event.
   * Calling this again overwrites the current function so only use it
   * once per command you were expecting
   * Call this with no argument to disable the current handler
   * @param {Function} [callback] - called with three parameters: error, commandName, commandData. If error is falsey, commandName and commandData will contain information about the next command that is seen. Either way, if an error occurs this handler must explicitly be set again if you want the same method to run next time
   */
  handleNextCommand(callback) {
    this._nextCommandHandler = callback || null;
  }

  initialize(callback) {
    if (this._connectionAttemptsRemaining === 0) {
      return this._completeHandshake(callback, new Error('No response after multiple connection attempts'));
    }
    this._connectionAttemptsRemaining -= 1;
    this._port.open((error) => this._handleOpen(error, callback));
  }

  _handleOpen(error, callback) {
    if (error) return callback(error);

    console.log(`Serial port opened: ${this._port.path}`);
    this._port.on("data", this._handleData.bind(this));
    this._port.on("error", this._handleError.bind(this));
    this._port.on("close", this._handleClose.bind(this));
    this._beginHandshake(callback);
  }

  _handleData(data) {
    this._buffer += data;

    // FIXME: Aggressive debugging of a serial port
//    if (this.path === '/dev/ttyACM2') {
//      console.log(`ttyACM2: ${("" + data).trim()}`);
//    }

    this._parseBuffer();
  }

  _handleError(error) {
    this._handleParsedCommand(error);
  }

  _handleClose(error, result) {
    console.log(`DEBUG: Port closed: ${error} ${result}`);
  }

  _parseBuffer() {
    const bufferParts = this._buffer.split(this.config.COMMAND_DELIMETER);
    // "abc".split() => ["abc"] whereas "abc\n".split() => ["abc", ""]
    // Thus, a command exists iff the length > 1.
    // The very last element can always be left in the buffer because it
    // cannot be proven to be a complete command
    // (to see why try splitting it and then apply the same logic)
    if (bufferParts.length < 1) {
      return;
    }

    this._buffer = bufferParts[bufferParts.length - 1];
    bufferParts.splice(-1, 1); // pop last (partial command) string

    for (const commandString of bufferParts) {
      if (commandString.trim().length > 0) this._parseCommandString(commandString);
    }
  }

  _parseCommandString(commandString) {
    let parseError = null;
    let commandName, commandData;
    try {
      ({name: commandName, data: commandData} = SerialProtocolCommandParser.parse(commandString));
    }
    catch (error) {
      // Filter by expected errors
      if (error instanceof Error) {
        parseError = error;
        console.warn(`Parse error: ${error}
Original string: "${commandString}" from ${this.path}
This command just may not be supported yet`);
      }
      // Throw unexpected errors
      else {
        throw error;
      }
    }
    this._handleParsedCommand(parseError, commandName, commandData);
  }

  _handleParsedCommand(error, commandName, commandData) {
    if (this._nextCommandHandler) {
      const commandHandler = this._nextCommandHandler;
      this._nextCommandHandler = null;
      commandHandler(error, commandName, commandData);
    }
    else {
      // In general, an invalid command is just ignored
      if (error) return;
      this._command(commandName, commandData);
    }
  }

  _error(message) {
    this.emit(SerialPort.EVENT_ERROR, message);
  }

  _command(commandName, commandData) {
    this.emit(SerialPort.EVENT_COMMAND, commandName, commandData);
  }

  _beginHandshake(callback) {
    const handshake = new SerialHandshake(this.config.HANDSHAKE, this);
    handshake.on(SerialHandshake.EVENT_FAILED, (err) => {
      this._completeHandshake(callback, err);
    });
    handshake.on(SerialHandshake.EVENT_TIMEOUT, () => {
      console.log(`${this.path} timed out. ${this._connectionAttemptsRemaining} attempts remaining`);
      this._port.close(() => {
        this.initialize(callback);
      });
    });
    handshake.on(SerialHandshake.EVENT_COMPLETE, () => {
      this._completeHandshake(callback);
    });
    handshake.execute();
  }

  _completeHandshake(callback, error) {
    console.log(`Handshake ended for ${this.path} ${error ? `with error: ${error.toString()}`: "(no errors)"}`);
    if (error) return callback(error);

    this._initialized = true;
    callback();
  }
}

