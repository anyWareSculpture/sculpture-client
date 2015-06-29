const {SculptureStore, PanelsActionCreator, MoleGameActionCreator} = require('@anyware/game-logic');

const SerialManager = require('../serial/serial-manager');
const serialProtocol = require('../serial/serial-protocol');
const {SerialProtocolCommandParser, SerialProtocolCommandBuilder} = serialProtocol;

export default class PanelView {
  constructor(store, dispatcher, serialManager) {
    this.store = store;
    this.serialManager = serialManager;
    this.serialManager.on(SerialManager.EVENT_COMMAND, this._handleCommand.bind(this));

    this.panelsActionCreator = new PanelsActionCreator(dispatcher);
    this.moleGameActionCreator = new MoleGameActionCreator(dispatcher);

    this.showAllPanels();
    this.store.on(SculptureStore.EVENT_CHANGE, this._handleChanges.bind(this));
  }

  showAllPanels() {
    
  }

  _handleChanges(changes) {
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
            intensity: panelChanges.intensity
          });
          this.serialManager.dispatchCommand(commandString);
        }

        if (panelChanges.hasOwnProperty("active") && panelChanges.active) {
          const commandString = SerialProtocolCommandBuilder.buildPanelPulse({
            stripId: stripId,
            panelId: panelId,
            intensity: 100,
            easing: "pulse"
          });
          this.serialManager.dispatchCommand(commandString);
        }
      }
    }
  }

  _handleCommand(commandName, commandArgs) {
    console.log(`COMMAND '${commandName}': ${JSON.stringify(commandArgs)}`);

    if (commandName === serialProtocol.PANEL_COMMAND) {
      const {stripId, panelId, pressed} = commandArgs;

      this.panelsActionCreator.sendPanelPressed(stripId, panelId, parseInt(pressed) ? true : false);
    }
  }
}
