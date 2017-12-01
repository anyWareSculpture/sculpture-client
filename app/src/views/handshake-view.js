import GAMES from 'anyware/lib/game-logic/constants/games';
import SculptureStore from 'anyware/lib/game-logic/sculpture-store';
import HandshakeGameLogic from 'anyware/lib/game-logic/logic/handshake-game-logic';
import SculptureActionCreator from 'anyware/lib/game-logic/actions/sculpture-action-creator';

import SerialManager from '../serial/serial-manager';
import * as SerialProtocol from '../serial/serial-protocol';
const {SerialProtocolCommandBuilder} = SerialProtocol;

/**
 * This view manages communication with the handshake interface.
 * We're also responsible for the timeout handling of the handshake by listening for all actions
 * and triggering the corresponding action.
 */
export default class HandshakeView {
  constructor(store, config, dispatcher, serialManager) {
    this.store = store;
    this.config = config;
    this.serialManager = serialManager;
    this.serialManager.on(SerialManager.EVENT_COMMAND, this._handleCommand.bind(this));

    this.sculptureActionCreator = new SculptureActionCreator(dispatcher);

    this._pulseInterval = null;
    this._complete = false;
    this._activityTimeout = null;

    this.store.on(SculptureStore.EVENT_CHANGE, this._handleChanges.bind(this));

  }

  get handshakes() {
    return this.store.data.get('handshakes');
  }

  _handleChanges(changes) {
    this._handleCurrentGameChanges(changes);
    this._handleHandshakesChanges(changes);
  }

  _handleCurrentGameChanges(changes) {
    if (!changes.hasOwnProperty("currentGame")) return;

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

  _handleHandshakesChanges(changes) {
    if (!changes.hasOwnProperty("handshakes") || !this.store.isReady) return;

    this._updateHandshakeVibrationIntensity();

    for (const sculptureId of Object.keys(handshakesChanges)) {
      switch (handshakesChanges[sculptureId]) {
      case HandshakeGameLogic.HANDSHAKE_ACTIVE:
        this._activateLocationPanel(sculptureId);

        if (sculptureId === this.store.me) {
          // Pulsing needs to be stopped if the user has activated the
          // handshake because both cannot happen at once
          this._endPulsing();
          this._activateMiddlePanel();
        }
        break;
      case HandshakeGameLogic.HANDSHAKE_PRESENT:
        if (sculptureId === this.store.me) {
          this._deactivateMiddlePanel();
        }
        break;
      case HandshakeGameLogic.HANDSHAKE_OFF:
        this._deactivateLocationPanel(sculptureId);
        break;
      }
    }
  }

  _activateLocationPanel(sculptureId) {
    const intensity = this.config.HANDSHAKE_HARDWARE.LOCATION_PANEL_ON_INTENSITY;
    const color = this.config.getLocationColor(sculptureId);
    const easing = this.config.HANDSHAKE_HARDWARE.LOCATION_PANEL_ON_EASING;

    this._locationPanelSet(sculptureId, {intensity, color, easing});
  }

  _deactivateLocationPanel(sculptureId) {
    const intensity = this.config.HANDSHAKE_HARDWARE.LOCATION_PANEL_OFF_INTENSITY;
    const easing = this.config.HANDSHAKE_HARDWARE.LOCATION_PANEL_OFF_EASING;

    this._locationPanelSet(sculptureId, {intensity, easing});
  }

  _activateMiddlePanel() {
    const intensity = this.config.HANDSHAKE_HARDWARE.MIDDLE_ON_INTENSITY;
    const color = this.config.HANDSHAKE_HARDWARE.MIDDLE_ON_COLOR || this.store.locationColor;
    const easing = this.config.HANDSHAKE_HARDWARE.MIDDLE_ON_EASING;

    this._middlePanelSet({intensity, color, easing});
  }

  _deactivateMiddlePanel() {
    const intensity = this.config.HANDSHAKE_HARDWARE.MIDDLE_OFF_INTENSITY;
    const color = this.config.HANDSHAKE_HARDWARE.MIDDLE_OFF_COLOR;
    const easing = this.config.HANDSHAKE_HARDWARE.MIDDLE_OFF_EASING;

    this._middlePanelSet({intensity, color, easing});
  }

  _locationPanelSet(sculptureId, {intensity, color, easing}) {
    const locationPanel = this.config.HANDSHAKE_HARDWARE.LOCATION_PANELS[sculptureId];

    this._handshakePanelSet(locationPanel, {intensity, color, easing});
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
    console.log(commandString);
    this.serialManager.dispatchCommand(commandString);
  }

  _updateHandshakeVibrationIntensity() {
    const handshakes = this.handshakes;
    const numUsers = Array.from(handshakes).reduce((total, sculptureId) => total + (handshakes.get(sculptureId) === HandshakeGameLogic.HANDSHAKE_ACTIVE ? 1 : 0), 0);
    const commandString = SerialProtocolCommandBuilder.buildHandshake({ numUsers });
    this.serialManager.dispatchCommand(commandString);
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
    this._pulseInterval = null;
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

  _refreshActivityTimeout() {
    if (this._activityTimeout) clearTimeout(this._activityTimeout);
    this._activityTimeout = setTimeout(this._activityTimeoutCB.bind(this),
                                       this.config.ALONE_MODE_SECONDS * 1000);
  }

  _activityTimeoutCB() {
    this._activityTimeout = null;
    this.sculptureActionCreator.sendHandshakeAction(this.store.me, HandshakeGameLogic.HANDSHAKE_OFF);
  }

  // Command from serial
  _handleCommand(commandName, commandArgs) {

    // Refresh timeout on any interaction
    this._refreshActivityTimeout();

    if (commandName === SerialProtocol.HANDSHAKE_COMMAND) {
      // numUsers is really just an active flag (0 or 1), but has this name for historic reasons
      const {numUsers: active} = commandArgs;

      if (parseInt(active) > 0) {
        this.sculptureActionCreator.sendHandshakeAction(this.store.me, HandshakeGameLogic.HANDSHAKE_ACTIVE);
      }
      else {
        this.sculptureActionCreator.sendHandshakeAction(this.store.me, HandshakeGameLogic.HANDSHAKE_PRESENT);
      }
    }
  }
}
