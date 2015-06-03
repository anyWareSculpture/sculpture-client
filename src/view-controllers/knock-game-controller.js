const GameConstants = require("@anyware/game-logic").GameConstants;

export default class KnockGameController {
  /**
   * Creates an instance of the knock game view-controller for the actual sculpture.
   * This uses a serial port to send serial commands based on the store.
   * @param {Dispatcher} dispatcher - A dispatcher that implements flux's dispatcher API
   * @param {KnockGameStore} knockGameStore - The instance of the knock game store to retrieve data from and bind a change handler to
   */
  constructor(dispatcher, knockGameStore, serialPort) {
    this.dispatcher = dispatcher;
    this.knockGameStore = knockGameStore;
    this.serialPort = serialPort;

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

    const commandString = ""; //TODO: PatternCommand.build(pattern);
    this.serialPort.write(commandString);
  }

  /**
   * Completes all initialization steps assuming the serial port is open
   */
  onSerialPortOpen() {

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
}
