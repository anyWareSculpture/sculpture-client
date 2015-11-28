const GAMES = require('@anyware/game-logic/lib/constants/games');
const SculptureStore = require('@anyware/game-logic/lib/sculpture-store');
const SculptureActionCreator = require('@anyware/game-logic/lib/actions/sculpture-action-creator');

const SerialManager = require('../serial/serial-manager');
const serialProtocol = require('../serial/serial-protocol');
const {SerialProtocolCommandParser, SerialProtocolCommandBuilder} = serialProtocol;

export default class HandshakeView {
  constructor(store, config, dispatcher, serialManager) {
    this.store = store;
    this.config = config;
    this.serialManager = serialManager;
    this.serialManager.on(SerialManager.EVENT_COMMAND, this._handleCommand.bind(this));

    this.sculptureActionCreator = new SculptureActionCreator(dispatcher);

    this._pulseInterval = null;

    this.store.on(SculptureStore.EVENT_CHANGE, this._handleChanges.bind(this));
  }

  reset() {
  }

  get handshakes() {
    return this.store.data.get('handshakes');
  }

  _handleChanges(changes) {
    this._handleCurrentGameChanges(changes);
    this._handleHandshakesChanges(changes);
  }

  _handleHandshakesChanges(changes) {
    const handshakesChanges = changes.handshakes;
    if (!handshakesChanges || !this.store.isReady) {
      return;
    }

    const handshakes = this.handshakes;
    const count = Array.from(handshakes).reduce((total, username) => {
      return total + (handshakes.get(username) ? 1 : 0);
    }, 0);
    const commandString = SerialProtocolCommandBuilder.buildHandshake({
      numUsers: count
    });
    this.serialManager.dispatchCommand(commandString);
  }

  _handleCurrentGameChanges(changes) {
    if (!changes.hasOwnProperty("currentGame")) {
      return
    }

    if (changes.currentGame === GAMES.HANDSHAKE) {
      // starting handshake game
      this._beginPulsing();
    }
    else {
      this._endPulsing();
    }
  }

  _beginPulsing() {
    // ensure that we can never orphan a timer
    this._endPulsing();

    this._pulseInterval = setInterval(this._pulse.bind(this),
      this.config.HANDSHAKE_HARDWARE.PULSE_DELAY);
  }

  _endPulsing() {
    clearInterval(this._pulseInterval);
  }

  _pulse() {
    const commandString = SerialProtocolCommandBuilder.buildPanelPulse({
      stripId: this.config.LIGHTS.HANDSHAKE_STRIP,
      panelId: '3',
      intensity: 100,
      color: 'white',
      easing: 'sleep'
    });
    this.serialManager.dispatchCommand(commandString);
  }

  _handleCommand(commandName, commandArgs) {
    if (commandName === serialProtocol.HANDSHAKE_COMMAND) {
      let {numUsers} = commandArgs;

      if (parseInt(numUsers) > 0) {
        this.sculptureActionCreator.sendHandshakeActivate(this.config.username);
      }
      else {
        this.sculptureActionCreator.sendHandshakeDeactivate(this.config.username);
      }
    }
  }
}
