require('source-map-support').install();

process.on('uncaughtException', (err) => {
  const currentDate = new Date();
  const currentDay = currentDate.toDateString();
  const currentTime = currentDate.toTimeString();
  console.error(`[${currentDay} ${currentTime}] ${err.stack}\n`);
});

const config = require('./config');

const SculptureApp = require('./app');

const DEFAULT_CLIENT_CONNECTION_OPTIONS = {
  protocol: "ws",
  username: "anyware",
  password: "anyware",
  host: "broker.shiftr.io"
};

const app = new SculptureApp(config);

const connectionOptions = Object.assign({}, DEFAULT_CLIENT_CONNECTION_OPTIONS);

if (process.argv.length === 4) {
  console.log("Using authentication information provided by command arguments");
  connectionOptions.username = process.argv[2];
  connectionOptions.password = process.argv[3];
}

app.connectAndSetup(connectionOptions);

