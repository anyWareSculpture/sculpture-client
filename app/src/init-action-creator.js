import BaseActionCreator from 'anyware/lib/game-logic/actions/base-action-creator';
import dispatcher from './dispatcher';

class InitActionCreator extends BaseActionCreator {
  // Action types
  static SCULPTURE_ID_FOUND = 'sculpture-id-found';
  static AUDIO_INITIALIZED = 'audio-initialized';
  static CLIENT_CONNECTED = 'client-connected';
  static SERIAL_PORT_INITIALIZED = 'serial-port-initialized';
  static SERIAL_PORT_ERROR = 'serial-port-error';
  static SERIAL_COMPLETE = 'serial-complete';
  static READY = 'ready';

  constructor() {
    super(dispatcher);
  }

  sendSculptureIdFound(sculptureId) {
    this._dispatch(InitActionCreator.SCULPTURE_ID_FOUND, { sculptureId });
  }

  sendAudioInitialized() {
    this._dispatch(InitActionCreator.AUDIO_INITIALIZED);
  }

  sendClientConnected(connected) {
    this._dispatch(InitActionCreator.CLIENT_CONNECTED, {connected});
  }

  sendSerialPortInitialized(serialManager, port) {
    this._dispatch(InitActionCreator.SERIAL_PORT_INITIALIZED, {serialManager, port});
  }

  sendSerialPortError(serialManager, error) {
    this._dispatch(InitActionCreator.SERIAL_PORT_ERROR, {serialManager, error});
  }

  sendSerialComplete(serialManager) {
    this._dispatch(InitActionCreator.SERIAL_COMPLETE, {serialManager});
  }

  sendReady() {
    this._dispatch(InitActionCreator.READY);
  }
}

const initActionCreator = new InitActionCreator();

export {InitActionCreator, initActionCreator};
