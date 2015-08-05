const {Dispatcher} = require("flux");

const StreamingClient = require("@anyware/streaming-client");
const {SculptureStore, SculptureActionCreator} = require("@anyware/game-logic");

const PanelView = require('./views/panel-view');
const DiskView = require('./views/disk-view');

const SerialManager = require('./serial/serial-manager');

export default class SculptureApp {
  constructor() {
    this.dispatcher = new Dispatcher();
    this.dispatcher.register((payload) => {
      this._log(`Sent action: ${JSON.stringify(payload)}`);
    });

    this.client = null;

    this.panelView = null;
    this.diskView = null;

    //TODO: Pass in a real identity
    this.serialManager = new SerialManager(0);
    this.serialManager.on(SerialManager.EVENT_COMMAND, (commandName, commandArgs) => {
      console.log(`COMMAND '${commandName}': ${JSON.stringify(commandArgs)}`);
    });

    this.sculpture = new SculptureStore(this.dispatcher);
    this.sculpture.on(SculptureStore.EVENT_CHANGE, (changes) => {
      this._log(`Sent state update: ${JSON.stringify(changes)}`);

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

    this.client.once(StreamingClient.EVENT_CONNECT, () => {
      // Temporarily here until the full game transitions are implemented
      if (!this.sculpture.isPlayingMoleGame) {
        //TODO: Hack! BAD
        setTimeout(() => {
          this._log("Starting disk game...");
          this.sculptureActionCreator.sendStartDiskGame();
        }, 4000);
      }
    });

    this.client.on(StreamingClient.EVENT_STATE_UPDATE, this._onStateUpdate.bind(this));
  }

  _onConnectionStatusChange() {
    this._log(`Client Connected: ${this.client.connected}`);
  }

  _onStateUpdate(update, metadata) {
    update.metadata = metadata;

    this._log(`Got state update: ${JSON.stringify(update)}`);

    this.sculptureActionCreator.sendMergeState(update);
  }
}

