import events from 'events';
import StreamingClient from 'anyware/lib/streaming-client';
import SculptureActionCreator from 'anyware/lib/game-logic/actions/sculpture-action-creator';
import {InitActionCreator, initActionCreator} from './init-action-creator';

import HandshakeView from './views/handshake-view';
import PanelView from './views/panel-view';
import AudioView from 'anyware/lib/views/audio-view';

import SerialManager from './serial/serial-manager';

import SculptureStore from 'anyware/lib/game-logic/sculpture-store';
import InitStore from './init-store';
import {initStore, sculptureStore} from './stores';

import config from './config';
import dispatcher from './dispatcher';

export default class SculptureApp extends events.EventEmitter {

  constructor() {
    super();

    dispatcher.register((payload) => {
      this._debug(`Sent action: ${JSON.stringify(payload)}`);
    });

    this.client = null;

    this.views = {};

    this._getSculptureId();

    this.serialManager = this._setupSerialManager();

    sculptureStore.on(SculptureStore.EVENT_CHANGE, (changes, metadata) => {
      if (!this.client) return;

      if (this.client.connected) {
        this.client.sendStateUpdate(changes, metadata);
        this._debug(`Sent state update: ${JSON.stringify(changes)}`);
      }
      else {
        console.warn("Streaming client not connected: ignoring changes");
      }
    });

    // FIXME: Find a better design for such cascading actions
    dispatcher.register((action) => {
      switch (action.actionType) {
      case InitActionCreator.SCULPTURE_ID_FOUND:
        if (!config.SINGLE_USER_MODE) {
          const connectionOptions = {
            ...config.CLIENT_CONNECTION_OPTIONS.default,
            username: action.sculptureId,
            password: config.CLIENT_CONNECTION_OPTIONS.credentials[action.sculptureId],
          };
          this._setupStreamingClient(connectionOptions);
        }
        break;
      case InitActionCreator.READY:
        setTimeout(() => this._beginFirstGame(), 0);
        break;
      default:
      }
    });

    this.sculptureActionCreator = new SculptureActionCreator(dispatcher);

    this._setupViews();
  }

  _debug(message) {
    if (config.DEBUG) console.debug(message);
  }

  _log(message) {
    console.log(message);
  }

  _error(message) {
    console.error(message);
  }

  /**
   * Get sculpture ID from local storage
   */
  _getSculptureId() {
    chrome.storage.local.get("sculptureId", (items) => {
      initActionCreator.sendSculptureIdFound(items.sculptureId ? items.sculptureId : config.defaultSculptureId);
    });
  }

  _setupViews() {
    this.views.handshakeView = new HandshakeView(sculptureStore, config, dispatcher, this.serialManager);
    this.views.panelView = new PanelView(sculptureStore, config, dispatcher, this.serialManager);
    this.views.audioView = new AudioView(sculptureStore, config, dispatcher);
    this.views.audioView.load((err) => {
      if (err) {
        console.log(`AudioView error: ${err}`);
        return;
      }
      initActionCreator.sendAudioInitialized();
      console.log('Loaded sounds');
    });
  }

  _setupStreamingClient(options) {
    if (this.client) this.client.close();

    this._log(`Streaming client: Using username ${options.username}`);

    this.client = new StreamingClient(options);

    // FIXME: If the onConnectionStatusChange is triggered, it will dispatch other actions (sendClientConnected and sendLogin) in the context of this dispatch. We need to decouple these.
    this.client.on(StreamingClient.EVENT_CONNECT, this._onConnectionStatusChange.bind(this));
    this.client.on(StreamingClient.EVENT_DISCONNECT, this._onConnectionStatusChange.bind(this));
    this.client.on(StreamingClient.EVENT_ERROR, this._error.bind(this));
    this.client.on(StreamingClient.EVENT_STATE_UPDATE, this._onStateUpdate.bind(this));
  }

  _setupSerialManager() {
    const serialManager = new SerialManager(config.SERIAL);
    serialManager.searchPorts(() => {
      console.log('Finished searching all serial ports');

      initActionCreator.sendSerialInitialized(serialManager);
    });
    return serialManager;
  }

  _onConnectionStatusChange() {
    this._log(`Streaming Client ${this.client.connected ? 'Connected' : 'Disconnected'}`);
    initActionCreator.sendClientConnected(this.client.connected);
    if (this.client.connected) {
      this.sculptureActionCreator.sendLogin(this.client.username);
    }
  }

  _onStateUpdate(update, metadata) {
    // Ignore our own state update. FIXME: Can this be configured with MQTT instead?
    if (metadata.from === sculptureStore.me) return;

    update.metadata = metadata;
    this._debug(`Got state update: ${JSON.stringify(update)}`);
    this.sculptureActionCreator.sendMergeState(update);
  }

  _beginFirstGame() {
    // TODO: Temporarily here until the full game transitions are implemented
    if (sculptureStore.isPlayingNoGame) {
      Object.keys(this.views).forEach((view) => this.views[view].reset());
      const game = config.GAMES_SEQUENCE[0];
      this._log(`Starting ${game} game...`);
      this.sculptureActionCreator.sendStartGame(game);
    }
  }
}
