import SculptureStore from 'anyware/lib/game-logic/sculpture-store';
import PanelsActionCreator from 'anyware/lib/game-logic/actions/panels-action-creator';
import SculptureActionCreator from 'anyware/lib/game-logic/actions/sculpture-action-creator';

import SerialManager from '../serial/serial-manager';
import * as SerialProtocol from '../serial/serial-protocol';
const {SerialProtocolCommandBuilder} = SerialProtocol;

export default class PanelView {
  constructor(store, config, dispatcher, serialManager) {
    this.store = store;
    this.config = config;
    this.serialManager = serialManager;
    this.serialManager.on(SerialManager.EVENT_COMMAND, this._handleCommand.bind(this));

    this.panelsActionCreator = new PanelsActionCreator(dispatcher);
    this.sculptureActionCreator = new SculptureActionCreator(dispatcher);

    this.store.on(SculptureStore.EVENT_CHANGE, this._handleChanges.bind(this));
  }

  get lightArray() {
    return this.store.data.get('lights');
  }

  showAllPanels() {
    const lightArray = this.lightArray;
    for (const stripId of lightArray.stripIds) {
      const panelIds = lightArray.get(stripId).panelIds;
      const colorGroups = {};
      for (const panelId of panelIds) {
        const intensity = lightArray.getIntensity(stripId, panelId);
        const color = lightArray.getColor(stripId, panelId);
        const key = `${color} ${intensity}`;
        if (colorGroups.hasOwnProperty(key)) {
          colorGroups[key].panelIds.push(panelId);
        }
        else {
          colorGroups[key] = {panelIds: [panelId], intensity, color};
        }
      }
      for (const group of Object.values(colorGroups)) {
        const commandString = SerialProtocolCommandBuilder.buildPanelSet({
          stripId,
          panelIds: group.panelIds.join(''),
          intensity: group.intensity,
          color: group.color
        });
        this.serialManager.dispatchCommand(commandString);
      }
    }
  }

  _handleChanges(changes) {
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
      const colorGroups = {};
      for (const panelId of Object.keys(panels)) {
        const panelChanges = panels[panelId];

        if (panelChanges.hasOwnProperty("intensity") || panelChanges.hasOwnProperty("color")) {
          const intensity = panelChanges.intensity || lightArray.getIntensity(stripId, panelId);
          const color = panelChanges.color || lightArray.getColor(stripId, panelId);
          const key = `${color} ${intensity}`;
          if (colorGroups.hasOwnProperty(key)) {
            colorGroups[key].panelIds.push(panelId);
          }
          else {
            colorGroups[key] = {panelIds: [panelId], intensity, color};
          }
        }
      }
      for (const group of Object.values(colorGroups)) {
        const commandString = SerialProtocolCommandBuilder.buildPanelSet({
          stripId,
          panelIds: group.panelIds.join(''),
          intensity: group.intensity,
          color: group.color
        });
        this.serialManager.dispatchCommand(commandString);
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
  }

}
