export default class AudioView {
  constructor(store, dispatcher) {
    this.store = store;
    this.store.on(SculptureStore.EVENT_CHANGE, this._handleChanges.bind(this));
  }

  _handleChanges(changes) {
  }
}
