const {Dispatcher} = require("flux");

const StreamingClient = require("@anyware/streaming-client");
const {SculptureStore, SculptureActionCreator} = require("@anyware/game-logic");

const PanelView = require('./views/panel-view');
const DiskView = require('./views/disk-view');
const AudioView = require('./views/audio-view');

const SerialManager = require('./serial/serial-manager');

export default class SculptureApp {
  constructor(config) {
    this.config = config;

    this.dispatcher = new Dispatcher();
    this.dispatcher.register((payload) => {
      this._log(`Sent action: ${JSON.stringify(payload)}`);
    });

    this.client = null;

    this.panelView = null;
    this.diskView = null;
    this.audioView = null;

    this.serialSearched = false;
    this.serialManager = this._setupSerialManager();

    this.sculpture = new SculptureStore(this.dispatcher, this.config);
    this.sculpture.on(SculptureStore.EVENT_CHANGE, (changes) => {
      this._log(`Sent state update: ${JSON.stringify(changes)}`);

      if (!this.client.connected) {
        console.warn("Streaming client not connected: ignoring changes");
        return;
      }
      this.client.sendStateUpdate(changes);
    });

    this.sculptureActionCreator = new SculptureActionCreator(this.dispatcher);

    this._setupViews();
  }

  /**
   * Connects to the streaming server and sets up the rest of the application
   */
  connectAndSetup(options) {
    this._connectionOptions = options;
    this._setupStreamingClient();
  }

  _log(message) {
    console.log(message);
  }

  _error(message) {
    console.error(message);
  }

  _setupViews() {
    this.panelView = new PanelView(this.sculpture, this.dispatcher, this.serialManager);
    this.diskView = new DiskView(this.sculpture, this.dispatcher, this.serialManager);
    this.audioView = new AudioView(this.sculpture, this.dispatcher);
  }

  _setupStreamingClient() {
    if (this.client) {
      this.client.close();
    }

    this._log(`Using username ${this._connectionOptions.username}`);

    this.client = new StreamingClient(this._connectionOptions);

    this.client.on(StreamingClient.EVENT_CONNECT, this._onConnectionStatusChange.bind(this));
    this.client.on(StreamingClient.EVENT_DISCONNECT, this._onConnectionStatusChange.bind(this));

    this.client.on(StreamingClient.EVENT_ERROR, this._error.bind(this));

    this.client.once(StreamingClient.EVENT_CONNECT, this._beginFirstGame.bind(this));

    this.client.on(StreamingClient.EVENT_STATE_UPDATE, this._onStateUpdate.bind(this));
  }

  _setupSerialManager() {
    const serialIdentity = this.config.HARDWARE_USERNAME_MAPPINGS[this.config.username];
    const serialManager = new SerialManager(this.config, serialIdentity);
    serialManager.searchPorts(() => {
      console.log('Finished searching all serial ports');

      this.serialSearched = true;
      //TODO: May need the views to write out the initial state in the store
      this._beginFirstGame();
    });
    return serialManager;
  }

  _onConnectionStatusChange() {
    this._log(`Streaming Client Connected: ${this.client.connected}`);
  }

  _onStateUpdate(update, metadata) {
    update.metadata = metadata;

    this._log(`Got state update: ${JSON.stringify(update)}`);

    this.sculptureActionCreator.sendMergeState(update);
  }

  _beginFirstGame() {
    if (!this.client || !this.client.connected || !this.serialSearched) {
      return;
    }

    //TODO: Temporarily here until the full game transitions are implemented
    if (this.sculpture.isPlayingNoGame) {
      const game = this.config.GAMES_SEQUENCE[0];
      this._log(`Starting ${game} game...`);
      this.sculptureActionCreator.sendStartGame(game);
    }
  }
}

