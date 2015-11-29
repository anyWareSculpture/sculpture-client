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
    this._complete = false;

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

    this._updateHandshakeVibrationIntensity();

    for (let username of Object.keys(handshakesChanges)) {
      if (handshakesChanges[username]) {
        this._activateUserPanel(username);

        if (username === this.store.username) {
          this._activateMiddlePanel();
        }
      }
      else {
        this._deactivateUserPanel(username);

        if (username === this.store.username) {
          this._deactivateMiddlePanel();
        }
      }
    }
  }

  _activateUserPanel(username) {
    const intensity = this.config.HANDSHAKE_HARDWARE.USER_PANEL_ON_INTENSITY;
    const color = this.config.getUserColor(username);
    const easing = this.config.HANDSHAKE_HARDWARE.USER_PANEL_ON_EASING;

    this._userPanelSet(username, {intensity, color, easing});
  }

  _deactivateUserPanel(username) {
    const intensity = this.config.HANDSHAKE_HARDWARE.USER_PANEL_OFF_INTENSITY;
    const easing = this.config.HANDSHAKE_HARDWARE.USER_PANEL_OFF_EASING;

    this._userPanelSet(username, {intensity, easing});
  }

  _activateMiddlePanel() {
    const intensity = this.config.HANDSHAKE_HARDWARE.MIDDLE_ON_INTENSITY;
    const color = this.config.HANDSHAKE_HARDWARE.MIDDLE_ON_COLOR || this.store.userColor;
    const easing = this.config.HANDSHAKE_HARDWARE.MIDDLE_ON_EASING;

    this._middlePanelSet({intensity, color, easing});
  }

  _deactivateMiddlePanel() {
    const intensity = this.config.HANDSHAKE_HARDWARE.MIDDLE_OFF_INTENSITY;
    const color = this.config.HANDSHAKE_HARDWARE.MIDDLE_OFF_COLOR;
    const easing = this.config.HANDSHAKE_HARDWARE.MIDDLE_OFF_EASING;

    this._middlePanelSet({intensity, color, easing});
  }

  _userPanelSet(username, {intensity, color, easing}) {
    const userPanel = this.config.HANDSHAKE_HARDWARE.USER_PANELS[username];

    this._handshakePanelSet(userPanel, {intensity, color, easing});
  }

  _middlePanelSet({intensity, color, easing}) {
    const panel = this.config.HANDSHAKE_HARDWARE.MIDDLE_PANEL;
    this._handshakePanelSet(panel, {intensity, color, easing});
  }

  _handshakePanelSet(panel, {intensity, color, easing}) {
    const commandString = SerialProtocolCommandBuilder.buildPanelSet({
      stripId: this.config.LIGHTS.HANDSHAKE_STRIP,
      panelId: panel,
      intensity: intensity,
      color: color,
      easing: easing
    });
    this.serialManager.dispatchCommand(commandString);
  }

  _updateHandshakeVibrationIntensity() {
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
      this._complete = false;
      this._beginPulsing();
    }
    else {
      this._endPulsing();
      this._complete = true;
    }
  }

  _beginPulsing() {
    // ensure that we can never orphan a timer
    this._endPulsing();

    this._pulse();

    this._pulseInterval = setInterval(() => {
      if (this._complete) {
        return;
      }
      
      this._pulse();
    }, this.config.HANDSHAKE_HARDWARE.PULSE_DELAY);
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
