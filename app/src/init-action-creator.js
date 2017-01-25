import BaseActionCreator from 'anyware/lib/game-logic/actions/base-action-creator';
import dispatcher from './dispatcher';

class InitActionCreator extends BaseActionCreator {
  // Action types
  static AUDIO_INITIALIZED = 'audio-initialized';
  static CLIENT_CONNECTED = 'client-connected';
  static SERIAL_INITIALIZED = 'serial-initialized';
  static READY = 'ready';

  constructor() {
    super(dispatcher);
  }

  sendAudioInitialized() {
    this._dispatch(InitActionCreator.AUDIO_INITIALIZED);
  }

  sendClientConnected(connected) {
    this._dispatch(InitActionCreator.CLIENT_CONNECTED, {connected});
  }

  sendSerialInitialized(serialManager) {
    this._dispatch(InitActionCreator.SERIAL_INITIALIZED, {serialManager});
  }

  sendReady() {
    this._dispatch(InitActionCreator.READY);
  }
}

const initActionCreator = new InitActionCreator();

export {InitActionCreator, initActionCreator};
