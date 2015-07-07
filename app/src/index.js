require('babelify/polyfill');

const SculptureApp = require('./app');

const DEFAULT_CLIENT_CONNECTION_OPTIONS = {
  protocol: "ws",
  username: "anyware",
  password: "anyware",
  host: "connect.shiftr.io"
};

const app = new SculptureApp();

const connectionOptions = Object.assign({}, DEFAULT_CLIENT_CONNECTION_OPTIONS);

if (process.argv.length === 4) {
  console.log("Using authentication information provided by command arguments");
  connectionOptions.username = process.argv[2];
  connectionOptions.password = process.argv[3];
}

app.connectAndSetup(connectionOptions);

