const serialport = require("serialport");
const SerialPort = serialport.SerialPort;

const serialProtocol = require('../serial/serial-protocol');
const SerialProtocolCommandParser = serialProtocol.SerialProtocolCommandParser;
const SerialProtocolCommandBuilder = serialProtocol.SerialProtocolCommandBuilder;

const GameLogic = require("@anyware/game-logic");
const GameConstants = GameLogic.GameConstants;

const DEFAULT_BAUDRATE = 115200;

export default class SculptureController {
  /**
   * Creates an instance of the sculpture view-controller
   * This uses a serial port to send serial commands based on the store.
   * @param {Dispatcher} dispatcher - A dispatcher that implements flux's dispatcher API
   * @param {SculptureStore} sculptureStore - The instance of the sculpture store to retrieve data from and bind a change handler to
   * @param {String} serialPortPath - The path to the serial port
   * @param {String} [serialPortOptions={}] - Additional options for the SerialPort constructor
   */
  constructor(dispatcher, sculptureStore, serialPortPath, serialPortOptions={}) {
    this.dispatcher = dispatcher;
    //TODO: this.sculptureStore = sculptureStore;
    this.serialPort = this._createSerialPort(serialPortPath, serialPortOptions);

    //TODO: this._listenForChanges(this.sculptureStore);
  }

  /**
   * @returns {Boolean} Returns true if the serial port is open
   */
  get isSerialPortOpen() {
    return this.serialPort.isOpen();
  }

  _createSerialPort(serialPortPath, options) {
    const serialPort = new SerialPort(serialPortPath, Object.assign({
      baudrate: DEFAULT_BAUDRATE,
      parser: serialport.parsers.readline("\n")
    }, options));
    serialPort.on("open", this._onSerialPortOpen.bind(this));
    return serialPort;
  }

  _onSerialPortOpen(error) {
    if (error) {
      throw new Error(`Failed to open serial port: ${error}`);
    }

    this.serialPort.on("data", this._handleData.bind(this));
  }

  _listenForChanges(store) {
    store.on(GameConstants.EVENT_CHANGE, this._onStoreChange.bind(this));
  }

  _onStoreChange(changes) {
    if (changes.pattern) {
      this.sendPattern(changes.pattern);
    }
  }

  _assertPortOpen() {
    if (!this.isSerialPortOpen) {
      throw new Error("Serial port must be open before reading/writing");
    }
  }

  _handleData(serialData) {
    console.log(`GOT SERIAL: ${serialData.toString().trim()}`);
    const {name, data} = SerialProtocolCommandParser.parse(serialData);

    if (name === serialProtocol.HELLO_COMMAND) {
      this._sendInitKnockGame()
    }
    else if (name === serialProtocol.PATTERN_COMMAND) {
      console.log(`Attempting to detect pattern: ${data.pattern}`); //TODO: Remove
      //TODO: Clean this up so it's not here
      this.dispatcher.dispatch({
        actionType: GameConstants.ACTION_TYPE_DETECT_KNOCK_PATTERN,
        pattern: data.pattern
      });
    }
  }

  _sendInitKnockGame() {
    this._assertPortOpen();

    const commandString = SerialProtocolCommandBuilder.build(serialProtocol.INIT_COMMAND, {game: "knock"}); //TODO: get rid of literals
    console.log(`PUT SERIAL: ${commandString.trim()}`); //TODO: Remove
    this.serialPort.write(commandString);
  }
}
