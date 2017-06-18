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
      serialComplete: null,
      systems: {},
      ready: false,
    };
    Object.keys(requiredCommands).forEach((name) => this.state.systems[name] = null);

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
    case InitActionCreator.SERIAL_PORT_INITIALIZED:
      this.state.systems = this._querySystems(action.serialManager, false);
      this.emitChange();
      break;
    case InitActionCreator.SERIAL_PORT_ERROR:
      this.state.systems = this._querySystems(action.serialManager, false);
      this.emitChange();
      break;
    case InitActionCreator.SERIAL_COMPLETE:
      if (this.state.serialComplete !== true) {
        this.state.serialComplete = true;
        this.state.systems = this._querySystems(action.serialManager, true);
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
        this.state.audioInitialized && this.state.clientConnected && this.state.serialComplete) {
      // FIXME: Also require all subsystems to be ready?
      // Wait 2 secs before starting game
      setTimeout(() => initActionCreator.sendReady(), 2000);
    }
  }

  // Pass complete = true if all ports are searched; this will make any failed states false rather
  // than uninitialized.
  _querySystems(serialManager, complete) {
    const systems = {};
    Object.keys(requiredCommands).forEach((name) => {
      const ports = serialManager.findTargetPorts(requiredCommands[name]);
      if (ports.size !== 0) systems[name] = true;
      else if (complete) systems[name] = false;
    });
    return systems;
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

  get serialComplete() {
    return this.state.serialComplete;
  }

  get systemState() {
    return this.state.systems;
  }

  get ready() {
    return this.state.ready;
  }
}
