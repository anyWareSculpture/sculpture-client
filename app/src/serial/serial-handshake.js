import events from 'events';
import * as SerialProtocol from './serial-protocol';
const {SerialProtocolCommandBuilder} = SerialProtocol;

export default class SerialHandshake extends events.EventEmitter {
  /**
   * Fired when the serial port handshake fails
   * Arguments for handler: Error object
   * @event SerialManager.EVENT_FAILED
   */
  static EVENT_FAILED = "failed";

  /**
   * Fired when we time out waiting for a response from a serial port
   * Arguments for handler: none
   * @event SerialManager.EVENT_TIMEOUT
   */
  static EVENT_TIMEOUT = "timeout";

  /**
   * Fired when a handshake successfully completes
   * Arguments for handler: none
   * @event SerialManager.EVENT_COMPLETE
   */
  static EVENT_COMPLETE = "complete";

  constructor(handshakeConfig, port) {
    super();
    this.handshakeConfig = handshakeConfig;
    this.port = port;

    this._helloSucceeded = false;
    this._helloAttempts = 0;
  }

  execute() {
    // If we always use auto-resetting microcontrollers, we don't need to send an initial HELLO.
    // Note: If we do send an initial HELLO, we run the risk of triggering bootloader mode, which could
    // cause a 6-8 second startup delay.
    // Was: this._sendHello();
    this._handleNextCommandWith(this._hello);
    this._beginTimeout();
  }

  _sendHello() {
    const commandString = SerialProtocolCommandBuilder.buildHello({debug: false});
    this.port.write(commandString, this._error.bind(this));
  }

  _hello(error, commandName, commandData) {
    this._helloAttempts += 1;

    if (error || commandName !== SerialProtocol.HELLO_COMMAND || commandName === SerialProtocol.DEBUG_COMMAND) {
      if (commandName === SerialProtocol.DEBUG_COMMAND) {
        console.log(`DEBUG: ${commandData.message} from ${this.port.path}`);

        this._helloAttempts -= 1;
        this._handleNextCommandWith(this._hello);
      }
      else if (this._helloAttempts >= this.handshakeConfig.HELLO_ATTEMPTS) {
        this._error(`Could not get HELLO after ${this.handshakeConfig.HELLO_ATTEMPTS} attempts`);
      }
      else {
        this._handleNextCommandWith(this._hello);
      }
      return;
    }

    this._helloSucceeded = true;
    this._handleNextCommandWith(this._supported);
  }

  _supported(error, commandName, commandData) {
    if (error || commandName !== SerialProtocol.SUPPORTED_COMMAND) {
      if (commandName === SerialProtocol.DEBUG_COMMAND) {
        this._debugMode(error, commandName, commandData);
      }
      else {
        this._error(`Did not receive SUPPORTED command. Got: ${error || commandName}`);
      }
      return;
    }

    this._handleNextCommandWith(this._supportedPattern);
  }

  _debugMode(error, commandName, commandData) {
    if (commandName !== SerialProtocol.DEBUG_COMMAND) {
      this._error(`Did not receive DEBUG command. Got: ${error || commandName}`);
      return;
    }

    this._handleNextCommandWith(this._supported);
  }

  _supportedPattern(error, commandName, commandData) {
    // Ignore unrecognized commands because they just imply that a command
    // the serial interface supports isn't supported by our code. That's
    // not a problem and if we need to support that command we will.
    if (error) {
      this._handleNextCommandWith(this._supportedPattern);
      return;
    }
    else if (commandName === SerialProtocol.END_SUPPORTED_COMMAND) {
      this._endHandshake();
      return;
    }

    const pattern = SerialProtocolCommandBuilder.build(commandName, commandData).trim();
    this.port.supportedPatterns.push(pattern);

    this._handleNextCommandWith(this._supportedPattern);
  }

  _handleNextCommandWith(handler) {
    this.port.handleNextCommand(handler ? handler.bind(this) : handler);
  }

  _endHandshake() {
    this._finish();
  }

  _error(message) {
    if (!message) {
      return;
    }
    this.emit(SerialHandshake.EVENT_FAILED, new Error(message.toString()));
  }

  _finish() {
    this.emit(SerialHandshake.EVENT_COMPLETE);
  }

  _beginTimeout() {
    setTimeout(() => {
      if (!this._helloSucceeded) {
        // no arguments resets it all
        this._handleNextCommandWith();
        this.emit(SerialHandshake.EVENT_TIMEOUT);
      }
    }, this.handshakeConfig.TIMEOUT);
  }
}
