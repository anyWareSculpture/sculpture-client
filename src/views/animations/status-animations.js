const {SerialProtocolCommandBuilder} = require('../../serial/serial-protocol');

export default class StatusAnimations {
  static playSuccessAnimation(view, completeCallback) {
    const frames = [
      // stripId, panelId, intensity, color
      [0, 3, 50, "success"],
      [1, 3, 50, "success"],
      [2, 3, 50, "success"],
      [0, 4, 100, "success"],
      [1, 4, 100, "success"],
      [2, 4, 100, "success"]
    ];

    StatusAnimations.playAnimation(frames, view, completeCallback);
  }

  static playFailureAnimation(view, completeCallback) {
    const frames = [
      // stripId, panelId, intensity, color
      [0, 3, 50, "error"],
      [2, 3, 50, "error"],
      [1, 3, 50, "error"],
      [0, 4, 100, "error"],
      [2, 4, 100, "error"],
      [1, 4, 100, "error"]
    ];

    StatusAnimations.playAnimation(frames, view, completeCallback);
  }

  static playAnimation(frames, view, completeCallback) {
    StatusAnimations.clearView(view);

    const playFrame = (frameIndex) => {
      if (frameIndex > 0) {
        const [stripId, panelId, intensity, color] = frames[frameIndex - 1];

        const commandString = SerialProtocolCommandBuilder.buildPanelSet({
          stripId: stripId,
          panelId: panelId,
          intensity: 0,
          color: color
        });
        view.serialManager.dispatchCommand(commandString);
      }

      const [stripId, panelId, intensity, color] = frames[frameIndex];

      const commandString = SerialProtocolCommandBuilder.buildPanelSet({
        stripId: stripId,
        panelId: panelId,
        intensity: 100,
        color: color
      });
      view.serialManager.dispatchCommand(commandString);

      let nextMethod;
      if (frameIndex >= frames.length - 1) {
        nextMethod = completeCallback;
      }
      else {
        nextMethod = () => playFrame(frameIndex + 1);
      }
      setTimeout(nextMethod, 300);
    };

    setTimeout(() => playFrame(0), 300);
  }

  static clearView(view) {
    //TODO: This code relies on there being certain hard coded stripIds
    //TODO: All of this should be using a config - that would then reflect
    //TODO: how the light array gets setup in the store
    for (let stripId of [0, 1, 2]) {
      for (let panelId = 0; panelId < 10; panelId++) {
        const commandString = SerialProtocolCommandBuilder.buildPanelSet({
          stripId: stripId,
          panelId: panelId,
          intensity: 0,
          color: "black"
        });
        view.serialManager.dispatchCommand(commandString);
      }
    }
  }
}
