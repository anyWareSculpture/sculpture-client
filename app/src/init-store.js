import {EventEmitter} from 'events';
import {InitActionCreator, initActionCreator} from './init-action-creator';
import config from './config';
import {SerialProtocolCommandBuilder, PANEL_SET_COMMAND, HANDSHAKE_COMMAND} from './serial/serial-protocol';

function buildRequiredCommands() {
  const commands = {};
  // All required panels
  for (const lightId of Object.keys(config.LIGHTS)) {
    const stripId = config.LIGHTS[lightId];
    commands[lightId] = SerialProtocolCommandBuilder.build(PANEL_SET_COMMAND, {stripId});
  }
  commands[HANDSHAKE_COMMAND] = SerialProtocolCommandBuilder.build(HANDSHAKE_COMMAND, {});
  return commands;
}

/*!
 * Stores initialization state of physical and logical subsystems
 */
export default class InitStore extends EventEmitter {

  static EVENT_CHANGE = 'change';

  constructor(dispatcher) {
    super();
    this.dispatcher = dispatcher;
    this.state = {
      username: null,
      audioInitialized: null,
      clientConnected: null,
      serialInitialized: null,
      systems: {},
      ready: false,
    };
    Object.keys(buildRequiredCommands()).forEach((name) => this.state.systems[name] = null);

    this.dispatcher.register(this.actionHandler.bind(this));
  }

  emitChange() {
    this.emit(InitStore.EVENT_CHANGE);
  }

  actionHandler(action) {
    switch (action.actionType) {
    case InitActionCreator.USERNAME_FOUND:
      console.log(`Usename found: ${action.username}`);
      this.state.username = action.username;
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
    case InitActionCreator.SERIAL_INITIALIZED:
      if (this.state.serialInitialized !== true) {
        this.state.serialInitialized = true;
        this.state.systems = this._querySystems(action.serialManager);
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
    if (!this.state.ready && this.state.username && 
        this.state.audioInitialized && this.state.clientConnected && this.state.serialInitialized) {
      // FIXME: Also require all subsystems to be ready?
      // Wait 2 secs before starting game
      setTimeout(() => initActionCreator.sendReady(), 2000);
    }
  }

  _querySystems(serialManager) {
    const systems = {};
    const commands = buildRequiredCommands();
    Object.keys(commands).forEach((name) => {
      const ports = serialManager.findTargetPorts(commands[name]);
      systems[name] =  ports.size !== 0;
    });
    return systems;
  }

  get username() {
    return this.state.username;
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
}
