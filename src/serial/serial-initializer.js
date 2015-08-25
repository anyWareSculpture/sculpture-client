export default class SerialInitializer {
  static initialize(port, callback) {
    this._port.open(this._beginInitialization.bind(this, callback));
  }

  static _beginInitialization(callback, error) {
    if (error) {
      callback(error);
      return;
    }

  }
}
