const events = require('events');
const {Dispatcher} = require("flux");

const StreamingClient = require("@anyware/streaming-client");

const SculptureStore = require("@anyware/game-logic/lib/sculpture-store");
const SculptureActionCreator = require("@anyware/game-logic/lib/actions/sculpture-action-creator");

const HandshakeView = require('./views/handshake-view');
const PanelView = require('./views/panel-view');
const DiskView = require('./views/disk-view');
const AudioView = require('@anyware/shared-views/lib/audio-view');

const SerialManager = require('./serial/serial-manager');

export default class SculptureApp extends events.EventEmitter {

  static EVENT_SERIAL_INITIALIZED = "serial-init";
  static EVENT_CLIENT_CONNECTED = "client-connected";

  constructor(config) {
    super();
    this.config = config;

    this.dispatcher = new Dispatcher();
    this.dispatcher.register((payload) => {
      this._log(`Sent action: ${JSON.stringify(payload)}`);
    });

    this.client = null;

    this.views = {};
    this.audioInitialized = false;

    this.serialSearched = false;
    this.serialManager = this._setupSerialManager();

    this.sculpture = new SculptureStore(this.dispatcher, this.config);
    this.sculpture.on(SculptureStore.EVENT_CHANGE, (changes) => {
      if (this.client) {
        if (this.client.connected) {
          this.client.sendStateUpdate(changes);
          this._log(`Sent state update: ${JSON.stringify(changes)}`);
        }
        else {
          console.warn("Streaming client not connected: ignoring changes");
        }
      }
    });

    this.sculptureActionCreator = new SculptureActionCreator(this.dispatcher);

    this._setupViews();
  }

  /**
   * Connects to the streaming server and sets up the rest of the application
   */
  connectAndSetup(options) {
    this._setupStreamingClient(options);
  }

  _log(message) {
    console.log(message);
  }

  _error(message) {
    console.error(message);
  }

  _setupViews() {
    this.views.handshakeView = new HandshakeView(this.sculpture, this.config, this.dispatcher, this.serialManager);
    this.views.panelView = new PanelView(this.sculpture, this.config, this.dispatcher, this.serialManager);
    this.views.diskView = new DiskView(this.sculpture, this.config, this.dispatcher, this.serialManager);
    this.views.audioView = new AudioView(this.sculpture, this.config, this.dispatcher);
    this.views.audioView.load(err => {
      if (err) {
        return console.log(`AudioView error: ${err}`);
      }
      this.audioInitialized = true;
      this._beginFirstGame();
      console.log('Loaded sounds');
    });
  }

  _setupStreamingClient(options) {
    if (this.client) {
      this.client.close();
    }

    this._log(`Using username ${options.username}`);

    if (this.config.SINGLE_USER_MODE) return;

    this.client = new StreamingClient(options);

    this.client.on(StreamingClient.EVENT_CONNECT, this._onConnectionStatusChange.bind(this));
    this.client.on(StreamingClient.EVENT_DISCONNECT, this._onConnectionStatusChange.bind(this));

    this.client.on(StreamingClient.EVENT_ERROR, this._error.bind(this));

    this.client.once(StreamingClient.EVENT_CONNECT, this._beginFirstGame.bind(this));

    this.client.on(StreamingClient.EVENT_STATE_UPDATE, this._onStateUpdate.bind(this));
  }

  _setupSerialManager() {
    const serialIdentity = this.config.HARDWARE_USERNAME_MAPPINGS[this.config.username];
    const serialManager = new SerialManager(this.config.SERIAL, serialIdentity);
    serialManager.searchPorts(() => {
      console.log('Finished searching all serial ports');

      this.serialSearched = true;
      // TODO: May need the views to write out the initial state in the store

      this.emit(SculptureApp.EVENT_SERIAL_INITIALIZED, serialManager);

      this._beginFirstGame();
    });
    return serialManager;
  }

  _onConnectionStatusChange() {
    this._log(`Streaming Client ${this.client.connected ? 'Connected' : 'Disconnected'}`);
    this.emit(SculptureApp.EVENT_CLIENT_CONNECTED, this.client.connected);
  }

  _onStateUpdate(update, metadata) {
    update.metadata = metadata;

    this._log(`Got state update: ${JSON.stringify(update)}`);

    this.sculptureActionCreator.sendMergeState(update);
  }

  _beginFirstGame() {
    if (this.client && !this.client.connected) return;
    if (!this.serialSearched || !this.audioInitialized) return;

    // TODO: Temporarily here until the full game transitions are implemented
    if (this.sculpture.isPlayingNoGame) {
      Object.keys(this.views).forEach(view => this.views[view].reset());
      const game = this.config.GAMES_SEQUENCE[0];
      this._log(`Starting ${game} game...`);
      this.sculptureActionCreator.sendStartGame(game);
    }
  }
}
