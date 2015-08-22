const {SculptureStore, MoleGameLogic, PanelsActionCreator, SculptureActionCreator} = require('@anyware/game-logic');

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

    this.showAllPanels();
    this.store.on(SculptureStore.EVENT_CHANGE, this._handleChanges.bind(this));
  }

  showAllPanels() {
    const lightArray = this.store.data.get('lights');

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
    if (!lightChanges) {
      return;
    }

    for (let stripId of Object.keys(lightChanges)) {
      const panels = lightChanges[stripId].panels;
      for (let panelId of Object.keys(panels)) {
        const panelChanges = panels[panelId];

        if (panelChanges.hasOwnProperty("intensity")) {
          const commandString = SerialProtocolCommandBuilder.buildPanelSet({
            stripId: stripId,
            panelId: panelId,
            intensity: panelChanges.intensity,
            color: this.store.data.get('lights').getColor(stripId, panelId)
          });
          this.serialManager.dispatchCommand(commandString);
        }

        if (panelChanges.hasOwnProperty("active")) {
          //TODO: Make this behaviour game specific with a default behaviour
          const commandString = SerialProtocolCommandBuilder.buildPanelSet({
            stripId: stripId,
            panelId: panelId,
            intensity: panelChanges.active ? 100 : 0,
            color: this.store.data.get('lights').getColor(stripId, panelId)
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
      [SculptureStore.STATUS_SUCCESS]: this._playSuccessAnimation.bind(this)
    };

    const animationMethod = statusAnimations[status];
    if (animationMethod) {
      animationMethod();
    }
  }

  _playSuccessAnimation() {
    StatusAnimations.playSuccessAnimation(this, this._animationComplete.bind(this));
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
