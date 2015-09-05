require('babelify/polyfill');

const config = require('./config');

const SculptureApp = require('./app');

const DEFAULT_CLIENT_CONNECTION_OPTIONS = {
  protocol: "ws",
  username: "sculpture0",
  password: "7f24a3e73b91dc9f51f15861d75c888b",
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

