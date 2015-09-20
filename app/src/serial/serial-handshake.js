const serialProtocol = require('./serial-protocol');
const {SerialProtocolCommandBuilder} = serialProtocol;

// The number of attempts to make towards getting a valid HELLO command
const HELLO_ATTEMPTS = 2;

export default class SerialHandshake {
  constructor(identity, port) {
    this.identity = identity;
    this.port = port;
    this.callback = null;

    this._helloAttempts = 0;
  }

  execute(callback) {
    this.callback = callback;
    this._handleNextCommandWith(this._hello);
  }

  _hello(error, commandName, commandData) {
    this._helloAttempts += 1;

    if (error || commandName !== serialProtocol.HELLO_COMMAND) {
      if (this._helloAttempts >= HELLO_ATTEMPTS) {
        this._error(`Could not get HELLO after ${HELLO_ATTEMPTS} attempts`);
      }
      else {
        this._handleNextCommandWith(this._hello);
      }
      return;
    }

    this._handleNextCommandWith(this._supported);
  }

  _supported(error, commandName, commandData) {
    if (error || commandName !== serialProtocol.SUPPORTED_COMMAND) {
      if (commandName === serialProtocol.DEBUG_COMMAND) {
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
    if (commandName !== serialProtocol.DEBUG_COMMAND) {
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
      return;
    }
    else if (commandName === serialProtocol.END_SUPPORTED_COMMAND) {
      this._endHandshake();
      return;
    }
  
    const pattern = SerialProtocolCommandBuilder.build(commandName, commandData);
    this.port.supportedPatterns.push(pattern);

    this._handleNextCommandWith(this._supportedPattern);
  }

  _handleNextCommandWith(handler) {
    this.port.handleNextCommand(handler.bind(this));
  }

  _endHandshake() {
    this._sendIdentity();
    this._sendInit();
    this._finish();
  }

  _sendIdentity() {
    const commandString = SerialProtocolCommandBuilder.buildIdentity({
      identity: this.identity
    });
    this.port.write(commandString, this._error.bind(this));
  }

  _sendInit() {
    const commandString = SerialProtocolCommandBuilder.buildInit();
    this.port.write(commandString, this._error.bind(this));
  }

  _error(message) {
    if (!message) {
      return;
    }
    this.callback(new Error(message));
  }

  _finish() {
    this.callback();
  }
}
