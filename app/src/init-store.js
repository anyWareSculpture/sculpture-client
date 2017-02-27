import {EventEmitter} from 'events';
import {InitActionCreator, initActionCreator} from './init-action-creator';
import config from './config';
import {SerialProtocolCommandBuilder, PANEL_SET_COMMAND, HANDSHAKE_COMMAND} from './serial/serial-protocol';

function buildRequiredCommands() {
  const commands = {};
  // All required panels
  for (const lightId of Object.keys(config.LIGHTS)) {
    const stripId = config.LIGHTS[lightId];
    commands[SerialProtocolCommandBuilder.build(PANEL_SET_COMMAND, {stripId})] = lightId;
  }
  commands[SerialProtocolCommandBuilder.build(HANDSHAKE_COMMAND, {})] = HANDSHAKE_COMMAND;
  return commands;
}

const requiredCommands = buildRequiredCommands();

/*!
 * Stores initialization state of physical and logical subsystems
 */
export default class InitStore extends EventEmitter {

  static EVENT_CHANGE = 'change';

  constructor(dispatcher) {
    super();
    this.dispatcher = dispatcher;
    this.state = {
      sculptureId: null,
      audioInitialized: null,
      clientConnected: null,
      serialInitialized: null,
      systems: {},
      ready: false,
    };
    Object.keys(requiredCommands).forEach((name) => this.state.systems[requiredCommands[name]] = null);

    this.dispatcher.register(this.actionHandler.bind(this));
  }

  emitChange() {
    this.emit(InitStore.EVENT_CHANGE);
  }

  actionHandler(action) {
    switch (action.actionType) {
    case InitActionCreator.SCULPTURE_ID_FOUND:
      console.log(`SculptureId found: ${action.sculptureId}`);
      this.state.sculptureId = action.sculptureId;
      this.emitChange();
      this._readyHandler();
      break;
    case InitActionCreator.AUDIO_INITIALIZED:
      if (this.state.audioInitialized !== true) {
        this.state.audioInitialized = true;
        this.emitChange();
        this._readyHandler();
      }
      break;
    case InitActionCreator.AUDIO_FAILED:
      if (!this.state.audioInitialized !== false) {
        this.state.audioInitialized = false;
        this.emitChange();
      }
      break;
    case InitActionCreator.CLIENT_CONNECTED:
      if (this.state.clientConnected !== action.connected) {
        this.state.clientConnected = action.connected;
        this.emitChange();
        if (action.connected) this._readyHandler();
      }
      break;
    case InitActionCreator.PATTERNS_FOUND:
      for (let pattern of action.patterns) {
        for (let cmd of Object.keys(requiredCommands)) {
          if (new RegExp(pattern).test(cmd)) {
            this.state.systems[requiredCommands[cmd]] = true;
            this.emitChange();
          }
        }
      }
      break;
    case InitActionCreator.SERIAL_INITIALIZED:
      if (this.state.serialInitialized !== true) {
        this.state.serialInitialized = true;

        for (let cmd of Object.keys(requiredCommands)) {
          if (!this.state.systems[requiredCommands[cmd]]) {
            this.state.systems[requiredCommands[cmd]] = false;
          }
        }

        this.emitChange();
        this._readyHandler();
      }
      break;
    case InitActionCreator.READY:
      if (this.state.ready !== true) {
        this.state.ready = true;
        this.emitChange();
      }
      break;
    default:
    }
  }

  _readyHandler() {
    if (!this.state.ready && this.state.sculptureId && 
        this.state.audioInitialized && this.state.clientConnected && this.state.serialInitialized) {
      // FIXME: Also require all subsystems to be ready?
      setTimeout(() => initActionCreator.sendReady(), 0);
    }
  }

  get sculptureId() {
    return this.state.sculptureId;
  }

  get audioInitialized() {
    return this.state.audioInitialized;
  }

  get clientConnected() {
    return this.state.clientConnected;
  }

  get serialInitialized() {
    return this.state.serialInitialized;
  }

  get systemState() {
    return this.state.systems;
  }

  get ready() {
    return this.state.ready;
  }

  get requiredPatternsFound() {
    return Object.keys(requiredCommands).every((name) => this.state.systems[requiredCommands[name]]);
  }

}
