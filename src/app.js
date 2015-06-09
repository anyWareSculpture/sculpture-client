const Dispatcher = require("flux").Dispatcher;

const StreamingClient = require("@anyware/streaming-client");
const GameLogic = require("@anyware/game-logic");
const GameConstants = GameLogic.GameConstants;
const KnockGameStore = GameLogic.KnockGameStore;

const SculptureController = require("./view-controllers/sculpture-controller");
const KnockGameController = require("./view-controllers/knock-game-controller");

const SERIAL_PORT_PATH = "/dev/ttyACM1";
const CLIENT_CONNECTION_OPTIONS = {
  protocol: "ws",
  username: "anyware",
  password: "anyware",
  host: "connect.shiftr.io:1884"
};

if (process.argv[2] && process.argv[3]) {
  CLIENT_CONNECTION_OPTIONS.username = process.argv[2];
  CLIENT_CONNECTION_OPTIONS.password = process.argv[3];
}
console.log("Using credentials:");
console.log(CLIENT_CONNECTION_OPTIONS);

// Dispatcher
const dispatcher = new Dispatcher();

// Connection
const client = new StreamingClient(CLIENT_CONNECTION_OPTIONS);
const connectionStatus = () => console.log(`Client connected: ${client.connected}`);
client.on(StreamingClient.EVENT_CONNECT, connectionStatus);
client.on(StreamingClient.EVENT_DISCONNECT, connectionStatus);
client.on(StreamingClient.EVENT_ERROR, (error) => console.error(error.stack || error.message || error));

// Stores
const knockGameStore = new KnockGameStore(dispatcher);

// Send/receive state updates
knockGameStore.on(GameConstants.EVENT_CHANGE, (changes) => {
  if (changes.complete) { //TODO: This is a hack
    const stateUpdate = {game: changes};
    console.log("SENDING STATE UPDATE:");
    console.log(stateUpdate);
    client.sendStateUpdate(stateUpdate);
  }
});
client.on(StreamingClient.EVENT_STATE_UPDATE, (stateUpdate) => {
  console.log("RECEIVED STATE UPDATE:");
  console.log(stateUpdate);
  if (stateUpdate.game) {
    dispatcher.dispatch({
      actionType: GameConstants.ACTION_TYPE_MERGE_GAME_STATE,
      stateUpdate: stateUpdate.game
    });
  }
});

// View controllers
const sculptureController = new SculptureController(dispatcher, null, SERIAL_PORT_PATH);
const knockGameController = new KnockGameController(dispatcher, knockGameStore, sculptureController.serialPort);
