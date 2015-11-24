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

    this.store.on(SculptureStore.EVENT_CHANGE, this._handleChanges.bind(this));
  }

  reset() {
  }

  get handshakes() {
    return this.store.data.get('handshakes');
  }

  _handleChanges(changes) {
    if (this._animating) {
      return;
    }

    this._handleHandshakesChanges(changes);
  }

  _handleHandshakesChanges(changes) {
    const handshakesChanges = changes.handshakes;
    if (!handshakesChanges || !this.store.isReady) {
      return;
    }

    for (let username of Object.keys(handshakesChanges)) {
      var isActive = handshakesChanges[username];

      const commandString = SerialProtocolCommandBuilder.buildHandshake({
        active: isActive,
        user: this.config.HARDWARE_USERNAME_MAPPINGS[username]
      });
      this.serialManager.dispatchCommand(commandString);
    }
  }

  _handleCommand(commandName, commandArgs) {
    if (commandName === serialProtocol.HANDSHAKE_COMMAND) {
      let {active} = commandArgs;

      if (parseInt(active)) {
        this.sculptureActionCreator.sendHandshakeActivate(this.config.username);
      }
      else {
        this.sculptureActionCreator.sendHandshakeDeactivate(this.config.username);
      }
    }
  }
}
