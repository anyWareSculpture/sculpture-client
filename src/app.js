const Dispatcher = require("flux").Dispatcher;

const GameLogic = require("@anyware/game-logic");
const KnockGameStore = GameLogic.KnockGameStore;

const SculptureController = require("./view-controllers/sculpture-controller");
const KnockGameController = require("./view-controllers/knock-game-controller");

const SERIAL_PORT_PATH = "/dev/ttyACM0";
const CLIENT_CONNECTION_OPTIONS = {
  protocol: "ws",
  username: "anyware",
  password: "anyware",
  host: "connect.shiftr.io:1884"
};

if (process.argv[2] && process.argv[3]) {
  console.log("Using provided credentials");
  CLIENT_CONNECTION_OPTIONS.username = process.argv[2];
  CLIENT_CONNECTION_OPTIONS.password = process.argv[3];
}

// Dispatcher
const dispatcher = new Dispatcher();

// Stores
const knockGameStore = new KnockGameStore(dispatcher);

// View controllers
const sculptureController = new SculptureController(dispatcher, null, SERIAL_PORT_PATH);
const knockGameController = new KnockGameController(dispatcher, knockGameStore, sculptureController.serialPort);
