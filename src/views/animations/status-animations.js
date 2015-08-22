const {SerialProtocolCommandBuilder} = serialProtocol;

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

  static playAnimation(frames, view, completeCallback) {
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
}
