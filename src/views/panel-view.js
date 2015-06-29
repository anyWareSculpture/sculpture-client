const {SculptureStore, MoleGameLogic, PanelsActionCreator, MoleGameActionCreator} = require('@anyware/game-logic');

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
    this._playAvailableAnimations();

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
          //TODO: this.serialManager.dispatchCommand(commandString);
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

  _playAvailableAnimations() {
    if (this._animating) {
      return;
    }

    if (this.store.isPlayingMoleGame) {
      const animation = this.store.currentGame.data.get("animation");
      if (animation) {
        this._animating = true;

        this._playMoleAnimation(animation);
      }
    }
  }

  _playMoleAnimation(animation) {
    if (animation === MoleGameLogic.ANIMATION_SUCCESS) {
      this._playMoleSuccessAnimation();
    }
  }

  _playMoleSuccessAnimation() {
    const frames = [
      // stripId, panelId, intensity
      [0, 3, 50],
      [1, 3, 50],
      [2, 3, 50],
      [0, 4, 100],
      [1, 4, 100],
      [2, 4, 100]
    ];

    const playFrame = (frameIndex) => {
      if (frameIndex > 0) {
        const [stripId, panelId, intensity] = frames[frameIndex - 1];

        const commandString = SerialProtocolCommandBuilder.buildPanelSet({
          stripId: stripId,
          panelId: panelId,
          intensity: 0,
          color: "success"
        });
        this.serialManager.dispatchCommand(commandString);
      }

      const [stripId, panelId, intensity] = frames[frameIndex];

      const commandString = SerialProtocolCommandBuilder.buildPanelSet({
        stripId: stripId,
        panelId: panelId,
        intensity: 100,
        color: "success"
      });
      this.serialManager.dispatchCommand(commandString);

      if (frameIndex >= frames.length - 1) {
        this._moleGameAnimationComplete();
      }
      else {
        setTimeout(() => playFrame(frameIndex + 1), 200);
      }
    };

    playFrame(0);
  }

  _moleGameAnimationComplete() {
    this._animating = false;

    this.showAllPanels();
    this.moleGameActionCreator.sendFinishAnimation();
  }
}
