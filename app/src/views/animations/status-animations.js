import {SerialProtocolCommandBuilder} from '../../serial/serial-protocol';

export default class StatusAnimations {
  static playSuccessAnimation(view, completeCallback) {
    const frames = [];

    let direction = 1;
    let lastPanel = null;
    for (let round = 0; round < 3; round++) {
      for (let i = 0; i < 10; i += 2) {
        const panel = direction === 1 ? i : 10 - i - 1;
        const panels = [[panel, 100, "success"]];
        if (lastPanel !== null) {
          panels.unshift([lastPanel, 0, "success"]);
        }
        const frame = () => panels;

        lastPanel = panel;
        frames.push(frame);
      }
      direction *= -1;
    }
    frames.push(() => [[lastPanel, 0, "success"]]);

    StatusAnimations.animateStrips(view, ['0', '1', '2'], frames, 50, completeCallback);
  }

  static playFailureAnimation(view, completeCallback) {
    const frames = [];

    let direction = 1;
    let lastPanel = null;
    for (let round = 0; round < 3; round++) {
      for (let i = 0; i < 10; i += 2) {
        const panel = direction === 1 ? i : 10 - i - 1;
        const panels = [[panel, 100, "error"]];
        if (lastPanel !== null) {
          panels.unshift([lastPanel, 0, "error"]);
        }
        const frame = () => panels;

        lastPanel = panel;
        frames.push(frame);
      }
      direction *= -1;
    }
    frames.push(() => [[lastPanel, 0, "error"]]);

    StatusAnimations.animateStrips(view, ['0', '1', '2'], frames, 50, completeCallback);
  }

  // FIXME: This is a hack to support failure animation on one panel
  static playSingleStripFailureAnimation(stripId, view, completeCallback) {
    const frames = [];

    let direction = 1;
    let lastPanel = null;
    for (let round = 0; round < 3; round++) {
      for (let i = 0; i < 10; i += 2) {
        const panel = direction === 1 ? i : 10 - i - 1;
        const panels = [[panel, 100, "error"]];
        if (lastPanel !== null) {
          panels.unshift([lastPanel, 0, "error"]);
        }
        const frame = () => panels;

        lastPanel = panel;
        frames.push(frame);
      }
      direction *= -1;
    }
    frames.push(() => [[lastPanel, 0, "error"]]);

    StatusAnimations.animateStrips(view, [stripId], frames, 50, completeCallback);
  }

  /**
   * Animates several strips identically
   * It is often useful for each frame function to undo its predecessor (don't forget!)
   * @param {PanelView} view - the panel view to apply this to
   * @param {String[]} strips - strip IDs
   * @param {Function[]} frames - functions that return an array of [panelId, intensity, color] for each frame
   * @param {Number} delay - delay between frames
   * @param {Function} completeCallback - the function to call when complete
   */
  static animateStrips(view, strips, frames, delay, completeCallback) {
    StatusAnimations.clearView(view);

    const playFrame = (frameIndex) => {
      const panelsProperties = frames[frameIndex]();

      for (const stripId of strips) {
        for (const [panelId, intensity, color] of panelsProperties) {
          const commandString = SerialProtocolCommandBuilder.buildPanelSet({
            stripId: stripId,
            // FIXME: If we reintroduce status animations, optimize this to send multiple panels when applicable
            panelIds: panelId,
            intensity: intensity,
            color: color
          });
          view.serialManager.dispatchCommand(commandString);
        }
      }

      let nextMethod;
      if (frameIndex >= frames.length - 1) {
        nextMethod = completeCallback;
      }
      else {
        nextMethod = () => playFrame(frameIndex + 1);
      }
      setTimeout(nextMethod, delay);
    };

    setTimeout(() => playFrame(0), delay);
  }

  static clearView(view) {
    for (const stripId of view.config.GAME_STRIPS) {
      const panelIds = view.config.PANELS[stripId];
      for (let i = 0; i < panelIds.length; i++) {
        const panelId = panelIds[i];
        const commandString = SerialProtocolCommandBuilder.buildPanelSet({
          stripId: stripId,
          // FIXME: If we reintroduce status animations, optimize this to send multiple panels when applicable
          panelIds: panelId,
          intensity: 0,
          color: "black"
        });
        view.serialManager.dispatchCommand(commandString);
      }
    }
  }
}
