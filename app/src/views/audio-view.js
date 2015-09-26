const {SculptureStore} = require('@anyware/game-logic');
const {Howl} = require('howler');

export default class AudioView {
  constructor(store, dispatcher) {
    this.store = store;
    this.store.on(SculptureStore.EVENT_CHANGE, this._handleChanges.bind(this));

    const ambientLoop = new Howl({
      urls: ['sounds/Pulse_Amb_Loop.wav'],
      loop: true
    }).fadeIn(0.3, 10000);

    this.panelsounds = [];
    for (let i=0;i<10;i++) {
      this.panelsounds.push(new Howl({
//        urls: [`sounds/LED_${("0"+(2*i+1)).slice(-2)}.wav`]
// This is an example of how to generate all LED sounds from the starting sound
// The 2.3 multiplication factor was found by experimentation
        urls: [`sounds/LED_01.wav`],
        rate: Math.pow(2, 2.3*i/12)
      }));
    }
  }

  _handleChanges(changes) {
    if (this._animating) {
      return;
    }
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
        if (panelChanges.hasOwnProperty("active")) {
          //TODO: Make this behaviour game specific with a default behaviour
          if (panelChanges.active) {
            console.log(`Play ${panelId}`);
            this._getPanelSound(panelId).play();
          }
        }
      }
    }
  }

  _getPanelSound(panelId) {
    return this.panelsounds[panelId];
  }

  get lightArray() {
    return this.store.data.get('lights');
  }
}
