const events = require('events');

const serialport = require('serialport');

const COMMAND_LINE_TERMINATOR = "\n";

/**
 * A higher-level adapter for serial ports that understands our custom serial protocol
 * Automatically handles opening and initialization
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

  constructor(path, options) {
    this.path = path;
    this.options = options;

    this._port = new serialport.SerialPort(path, options, false);

    this._initialized = false;
  }

  initialize(callback) {
    this._port.open(this._beginInitialization.bind(this, callback));
  }

  _beginInitialization(callback, error) {
    if (error) {
      callback(error);
      return;
    }

  }
}
