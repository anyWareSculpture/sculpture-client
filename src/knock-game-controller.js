const serialport = require("serialport");
const SerialPort = serialport.SerialPort;

const GameConstants = require("@anyware/game-logic").GameConstants;

const serialProtocolCommands = require('./serial-protocol-commands');
const PatternCommand = serialProtocolCommands.PatternCommand;

const DEFAULT_BAUDRATE = 115200;

export default class KnockGameController {
  /**
   * Creates an instance of the knock game view-controller for the actual sculpture.
   * This uses a serial port to send serial commands based on the store.
   * @param {Dispatcher} dispatcher - A dispatcher that implements flux's dispatcher API
   * @param {KnockGameStore} knockGameStore - The instance of the knock game store to retrieve data from and bind a change handler to
   * @param {String} serialPortPath - The path to the serial port
   * @param {String} [serialPortOptions={}] - Additional options for the SerialPort constructor
   */
  constructor(dispatcher, knockGameStore, serialPortPath, serialPortOptions={}) {
    this.dispatcher = dispatcher;
    this.knockGameStore = knockGameStore;
    this.serialPort = this._createSerialPort(serialPortPath, serialPortOptions);

    this._listenForChanges(this.knockGameStore);
  }
  
  /**
   * @returns {Boolean} Returns true if the serial port is open
   */
  get isSerialPortOpen() {
    return this.serialPort.isOpen();
  }

  /**
   * Sends the given pattern accross the serial port
   * @param {Number[]} pattern - The pattern to send
   */
  sendPattern(pattern) {
    this._assertPortOpen();

    commandString = PatternCommand.build(pattern);
    this.serialPort.write(commandString);
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

  _handleData() {
    //TODO
  }
}
