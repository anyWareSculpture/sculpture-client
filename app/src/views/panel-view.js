const SculptureStore = require('@anyware/game-logic/lib/sculpture-store');
const PanelsActionCreator = require('@anyware/game-logic/lib/actions/panels-action-creator');
const SculptureActionCreator = require('@anyware/game-logic/lib/actions/sculpture-action-creator');

const SerialManager = require('../serial/serial-manager');
const serialProtocol = require('../serial/serial-protocol');
const {SerialProtocolCommandParser, SerialProtocolCommandBuilder} = serialProtocol;

const StatusAnimations = require('./animations/status-animations');

export default class PanelView {
  constructor(store, dispatcher, serialManager) {
    this.store = store;
    this.serialManager = serialManager;
    this.serialManager.on(SerialManager.EVENT_COMMAND, this._handleCommand.bind(this));

    this.panelsActionCreator = new PanelsActionCreator(dispatcher);
    this.sculptureActionCreator = new SculptureActionCreator(dispatcher);

    this._animating = false;

    this.store.on(SculptureStore.EVENT_CHANGE, this._handleChanges.bind(this));
  }

  get lightArray() {
    return this.store.data.get('lights');
  }

  showAllPanels() {
    const lightArray = this.lightArray;
    for (let stripId of lightArray.stripIds) {
      const panelIds = lightArray.get(stripId).panelIds;
      for (let panelId of panelIds) {
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
    for (let stripId of Object.keys(lightChanges)) {
      const panels = lightChanges[stripId].panels;
      for (let panelId of Object.keys(panels)) {
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

        if (panelChanges.hasOwnProperty("active")) {
          //TODO: Make this behaviour game specific with a default behaviour
          let intensity, color;
          if (panelChanges.active) {
            intensity = 100;
            color = this.store.userColor;
          }
          else {
            intensity = lightArray.getIntensity(stripId, panelId);
            color = lightArray.getColor(stripId, panelId);
          }

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
    if (commandName === serialProtocol.PANEL_COMMAND) {
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
    StatusAnimations.playFailureAnimation(this, this._animationComplete.bind(this));
  }

  _animationComplete() {
    this._animating = false;
    this.sculptureActionCreator.sendFinishStatusAnimation();

    //TODO: setTimeout is used here as a hack to compensate
    //TODO: for the problem with many commands sent at once
    //TODO: being garbled up together
    setTimeout(() => {
      this.showAllPanels();
    }, 500);
  }
}
