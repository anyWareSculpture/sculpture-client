import SculptureStore from 'anyware/lib/game-logic/sculpture-store';
import PanelsActionCreator from 'anyware/lib/game-logic/actions/panels-action-creator';
import SculptureActionCreator from 'anyware/lib/game-logic/actions/sculpture-action-creator';

import SerialManager from '../serial/serial-manager';
import * as SerialProtocol from '../serial/serial-protocol';
const {SerialProtocolCommandBuilder} = SerialProtocol;

import StatusAnimations from './animations/status-animations';

export default class PanelView {
  constructor(store, config, dispatcher, serialManager) {
    this.store = store;
    this.config = config;
    this.serialManager = serialManager;
    this.serialManager.on(SerialManager.EVENT_COMMAND, this._handleCommand.bind(this));

    this.panelsActionCreator = new PanelsActionCreator(dispatcher);
    this.sculptureActionCreator = new SculptureActionCreator(dispatcher);

    this._animating = false;

    this.store.on(SculptureStore.EVENT_CHANGE, this._handleChanges.bind(this));
  }

  reset() {
  }

  get lightArray() {
    return this.store.data.get('lights');
  }

  showAllPanels() {
    const lightArray = this.lightArray;
    for (const stripId of lightArray.stripIds) {
      const panelIds = lightArray.get(stripId).panelIds;
      for (const panelId of panelIds) {
        const intensity = lightArray.getIntensity(stripId, panelId);
        const color = lightArray.getColor(stripId, panelId);

        const commandString = SerialProtocolCommandBuilder.buildPanelSet({
          stripId: stripId,
          panelId: panelId,
          intensity: intensity,
          color: color
        });
        this.serialManager.dispatchCommand(commandString);
      }
    }
  }

  _handleChanges(changes) {
    if (this._animating) {
      return;
    }

    this._handleStatusChanges(changes);
    this._handleLightChanges(changes);
  }

  _handleLightChanges(changes) {
    const lightChanges = changes.lights;
    if (!lightChanges || !this.store.isReady) {
      return;
    }

    const lightArray = this.lightArray;
    for (const stripId of Object.keys(lightChanges)) {
      const panels = lightChanges[stripId].panels;
      for (const panelId of Object.keys(panels)) {
        const panelChanges = panels[panelId];

        if (panelChanges.hasOwnProperty("intensity") || panelChanges.hasOwnProperty("color")) {
          const intensity = panelChanges.intensity || lightArray.getIntensity(stripId, panelId);
          const color = panelChanges.color || lightArray.getColor(stripId, panelId);
          const commandString = SerialProtocolCommandBuilder.buildPanelSet({
            stripId: stripId,
            panelId: panelId,
            intensity: intensity,
            color: color
          });
          this.serialManager.dispatchCommand(commandString);
        }
      }
    }
  }

  _handleCommand(commandName, commandArgs) {
    if (commandName === SerialProtocol.PANEL_COMMAND) {
      const {stripId, panelId, pressed} = commandArgs;

      this.panelsActionCreator.sendPanelPressed(stripId, panelId, parseInt(pressed) ? true : false);
    }
  }

  _handleStatusChanges(changes) {
    const status = changes.status;
    const statusAnimations = {
      [SculptureStore.STATUS_SUCCESS]: this._playSuccessAnimation.bind(this),
      [SculptureStore.STATUS_FAILURE]: this._playFailureAnimation.bind(this)
    };

    const animationMethod = statusAnimations[status];
    if (animationMethod) {
      animationMethod();
    }
  }

  _playSuccessAnimation() {
    StatusAnimations.playSuccessAnimation(this, this._animationComplete.bind(this));
  }

  _playFailureAnimation() {
    // FIXME: This is a hack to support failure animation on one panel
    if (this.store.isPlayingSimonGame) {
      const simongame = this.store.currentGameLogic;
      StatusAnimations.playSingleStripFailureAnimation(simongame.currentStrip, this, this._animationComplete.bind(this));
    }
    else {
      StatusAnimations.playFailureAnimation(this, this._animationComplete.bind(this));
    }
  }

  _animationComplete() {
    this._animating = false;
    this.sculptureActionCreator.sendFinishStatusAnimation();

    // TODO: setTimeout is used here as a hack to compensate
    // TODO: for the problem with many commands sent at once
    // TODO: being garbled up together
    setTimeout(() => {
      this.showAllPanels();
    }, 500);
  }
}
