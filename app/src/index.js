require('babelify/polyfill');

const Config = require('./config');
const SculptureApp = require('./app');

const config = new Config();
const app = new SculptureApp(config);

const connectionOptions = Object.assign({}, config.CLIENT_CONNECTION_OPTIONS.default);

if (process.argv.length === 4) {
  console.log("Using authentication information provided by command arguments");
  connectionOptions.username = process.argv[2];
  connectionOptions.password = process.argv[3];
}

app.connectAndSetup(connectionOptions);

