const serialProtocol = require("../serial/serial-protocol");
const SerialProtocolCommandBuilder = serialProtocol.SerialProtocolCommandBuilder;
const GameLogic = require("@anyware/game-logic");
const GameConstants = GameLogic.GameConstants;
const KnockGameStore = GameLogic.KnockGameStore;

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

    this.serialPort.on("open", this._onSerialPortOpen.bind(this));

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

    const commandString = SerialProtocolCommandBuilder.build(serialProtocol.PATTERN_COMMAND, {pattern: pattern});
    console.log(`PUT SERIAL: ${commandString.trim()}`); //TODO: Remove
    this.serialPort.write(commandString);
  }

  /**
   * Completes all initialization steps assuming the serial port is open
   */
  _onSerialPortOpen() {
    //TODO: Make this better
    setTimeout(() => {
      const sendInitPattern = () => {
        console.log("Sending initial knock pattern..."); //TODO: Remove
        KnockGameStore.sendInitialKnockPattern(this.dispatcher);
      };
      setInterval(sendInitPattern, 15000);
      sendInitPattern();
    }, 5000); //TODO: Bad
  }

  _listenForChanges(store) {
    store.on(GameConstants.EVENT_CHANGE, this._onStoreChange.bind(this));
  }

  _onStoreChange(changes) {
    if (changes.pattern) {
      this.sendPattern(changes.pattern);
    }
    if (changes.complete) {
      console.log("Knock game complete!"); //TODO: Remove
      
      this._reinitKnockGame();
    }
  }

  _assertPortOpen() {
    if (!this.isSerialPortOpen) {
      throw new Error("Serial port must be open before reading/writing");
    }
  }

  _reinitKnockGame() {
    let commandString = SerialProtocolCommandBuilder.buildExit({game: "knock"});
    console.log(`PUT SERIAL: ${commandString.trim()}`); //TODO: Remove
    this.serialPort.write(commandString);

    commandString = SerialProtocolCommandBuilder.buildInit({game: "knock"});
    console.log(`PUT SERIAL: ${commandString.trim()}`); //TODO: Remove
    this.serialPort.write(commandString);
  }
}
