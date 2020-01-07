import GAMES from 'anyware/lib/game-logic/constants/games';
import SculptureStore from 'anyware/lib/game-logic/sculpture-store';
import HandshakeGameLogic from 'anyware/lib/game-logic/logic/handshake-game-logic';
import SculptureActionCreator from 'anyware/lib/game-logic/actions/sculpture-action-creator';
import * as AudioAPI from 'anyware/lib/views/audio-api';

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

    this._pulseIntervals = {};
    this._activityTimeout = null;
    this._sleepTimeout = null;

    this.store.on(SculptureStore.EVENT_CHANGE, this._handleChanges.bind(this));

    // FIXME: We begin by pulsing. Not the best design..
    this._beginPulsing(this.config.HANDSHAKE_HARDWARE.MIDDLE_PANEL,
                       this.config.HANDSHAKE_HARDWARE.PULSE_DELAY,
                       this._sleepPulse.bind(this));
  }

  _getHandshakes() {
    return this.store.data.get('handshake').get('handshakes');
  }

  _handleChanges(changes) {
    if (!(this.store.isReady || this.store.isInit) || !changes.hasOwnProperty('handshake') || !changes.handshake.hasOwnProperty('handshakes')) return;

    this._updateHandshakeVibrationIntensity();

    const handshakesChanges = changes.handshake.handshakes;
    for (const sculptureId of Object.keys(handshakesChanges)) {
      switch (handshakesChanges[sculptureId]) {
      case HandshakeGameLogic.HANDSHAKE_ACTIVATING:
      case HandshakeGameLogic.HANDSHAKE_ACTIVE:
        this._pulseLocationPanel(sculptureId);

        if (sculptureId === this.store.me) {
          // Pulsing needs to be stopped if the user has activated the
          // handshake because both cannot happen at once
          this._endPulsing(this.config.HANDSHAKE_HARDWARE.MIDDLE_PANEL);
          this._activateMiddlePanel();
        }
        break;
      case HandshakeGameLogic.HANDSHAKE_PRESENT:
        this._activateLocationPanel(sculptureId);
        if (sculptureId === this.store.me) {
          this._activateMiddlePanel();
        }
        break;
      case HandshakeGameLogic.HANDSHAKE_OFF:
        this._deactivateLocationPanel(sculptureId);
        if (sculptureId === this.store.me) {
          this._deactivateMiddlePanel();
          this._beginPulsing(this.config.HANDSHAKE_HARDWARE.MIDDLE_PANEL,
                             this.config.HANDSHAKE_HARDWARE.PULSE_DELAY,
                             this._sleepPulse.bind(this));
        }
        break;
      }
    }
  }

  _pulseLocationPanel(sculptureId) {
    const locationPanel = this.config.HANDSHAKE_HARDWARE.LOCATION_PANELS[sculptureId];
    this._beginPulsing(locationPanel, 1000, () => {
      const color = this.config.getLocationColor(sculptureId);
      const intensity = this.config.HANDSHAKE_HARDWARE.LOCATION_PANEL_ON_INTENSITY;
      this._handshakePanelSet(locationPanel, {intensity, color});
      if (sculptureId === this.store.me) {
        this._handshakePanelSet(this.config.HANDSHAKE_HARDWARE.MIDDLE_PANEL, {intensity, color});
      }
      this._handshakePanelPulse(locationPanel, {intensity: 50, easing: 'pulse'});
      if (sculptureId === this.store.me) {
        this._handshakePanelPulse(this.config.HANDSHAKE_HARDWARE.MIDDLE_PANEL, {intensity: 50, easing: 'pulse'});
      }
    });
  }

  _activateLocationPanel(sculptureId) {
    const locationPanel = this.config.HANDSHAKE_HARDWARE.LOCATION_PANELS[sculptureId];
    this._endPulsing(locationPanel);
    const intensity = this.config.HANDSHAKE_HARDWARE.LOCATION_PANEL_ON_INTENSITY;
    const color = this.config.getLocationColor(sculptureId);
    const easing = this.config.HANDSHAKE_HARDWARE.LOCATION_PANEL_ON_EASING;

    this._locationPanelSet(sculptureId, {intensity, color, easing});
  }

  _deactivateLocationPanel(sculptureId) {
    const locationPanel = this.config.HANDSHAKE_HARDWARE.LOCATION_PANELS[sculptureId];
    this._endPulsing(locationPanel);
    const intensity = this.config.HANDSHAKE_HARDWARE.LOCATION_PANEL_OFF_INTENSITY;
    const easing = this.config.HANDSHAKE_HARDWARE.LOCATION_PANEL_OFF_EASING;

    this._locationPanelSet(sculptureId, {intensity, easing});
  }

  _activateMiddlePanel() {
    const intensity = this.config.HANDSHAKE_HARDWARE.MIDDLE_ON_INTENSITY;
    const color = this.store.locationColor;
    const easing = this.config.HANDSHAKE_HARDWARE.MIDDLE_ON_EASING;

    this._middlePanelSet({intensity, color, easing});
  }

  _deactivateMiddlePanel() {
    const intensity = this.config.HANDSHAKE_HARDWARE.MIDDLE_OFF_INTENSITY;
    const color = this.store.locationColor;
    const easing = this.config.HANDSHAKE_HARDWARE.MIDDLE_OFF_EASING;

    this._middlePanelSet({intensity, color, easing});
  }

  _locationPanelSet(sculptureId, {intensity, color, easing}) {
    const locationPanel = this.config.HANDSHAKE_HARDWARE.LOCATION_PANELS[sculptureId];

    this._handshakePanelSet(locationPanel, {intensity, color, easing});
  }

  _locationPanelPulse(sculptureId, {intensity, color, easing}) {
    const locationPanel = this.config.HANDSHAKE_HARDWARE.LOCATION_PANELS[sculptureId];

    this._handshakePanelPulse(locationPanel, {intensity, color, easing});
  }

  _middlePanelSet({intensity, color, easing}) {
    const panel = this.config.HANDSHAKE_HARDWARE.MIDDLE_PANEL;
    this._handshakePanelSet(panel, {intensity, color, easing});
  }

  _handshakePanelSet(panelId, {intensity, color, easing}) {
    const commandString = SerialProtocolCommandBuilder.buildPanelSet({
      stripId: this.config.LIGHTS.HANDSHAKE_STRIP,
      panelIds: panelId,
      intensity,
      color,
      easing,
    });
    this.serialManager.dispatchCommand(commandString);
  }

  _handshakePanelPulse(panelId, {intensity, color, easing}) {
    const commandString = SerialProtocolCommandBuilder.buildPanelPulse({
      stripId: this.config.LIGHTS.HANDSHAKE_STRIP,
      panelIds: panelId,
      intensity,
      color,
      easing,
    });
    this.serialManager.dispatchCommand(commandString);
  }

  _updateHandshakeVibrationIntensity() {
    const handshakes = this._getHandshakes();
    const numUsers = Array.from(handshakes).reduce((total, sculptureId) => {
      return total +
        (handshakes.get(sculptureId) === HandshakeGameLogic.HANDSHAKE_ACTIVATING ? 1 : 0) +
        (handshakes.get(sculptureId) === HandshakeGameLogic.HANDSHAKE_ACTIVE ? 1 : 0);
    }, 0);
    const commandString = SerialProtocolCommandBuilder.buildHandshake({ numUsers });
    this.serialManager.dispatchCommand(commandString);
  }

  _beginPulsing(panelId, period, pulseFunction) {
    // ensure that we can never orphan a timer
    this._endPulsing(panelId);

    pulseFunction();
    this._pulseIntervals[panelId] = setInterval(pulseFunction, period);
  }

  _endPulsing(panelId) {
    clearInterval(this._pulseIntervals[panelId]);
    this._pulseIntervals[panelId] = null;
  }

  _sleepPulse() {
    this._handshakePanelSet(this.config.HANDSHAKE_HARDWARE.MIDDLE_PANEL, {intensity: 0, color: 'white'});
    this._handshakePanelPulse(this.config.HANDSHAKE_HARDWARE.MIDDLE_PANEL, {intensity: 100, color: 'white', easing: 'sleep'});
  }

  _refreshActivityTimeout() {
    if (this._activityTimeout) clearTimeout(this._activityTimeout);
    if (this._sleepTimeout) clearTimeout(this._sleepTimeout);
    this._activityTimeout = setTimeout(this._activityTimeoutCB.bind(this),
                                       this.config.ALONE_MODE_SECONDS * 1000);
  }

  _activityTimeoutCB() {
    this._activityTimeout = null;
    this.sculptureActionCreator.sendHandshakeAction(this.store.me, HandshakeGameLogic.HANDSHAKE_OFF);
    this._refreshSleepTimeout();
  }

  _refreshSleepTimeout() {
    if (this._sleepTimeout) clearTimeout(this._sleepTimeout);
    this._sleepTimeout = setTimeout(this._sleepTimeoutCB.bind(this),
                                    this.config.SLEEP_MODE_SECONDS * 1000);
  }

  _sleepTimeoutCB() {
    this._sleepTimeout = null;
    AudioAPI.setMasterVolume(this.config.SLEEP_VOLUME);
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
