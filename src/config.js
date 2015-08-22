const {DefaultConfig} = require('@anyware/game-logic');

const config = Object.assign({}, DefaultConfig);
export default config;

config.username = "sculpture0";

config.HARDWARE_USERNAME_MAPPINGS = {
  sculpture0: '0',
  sculpture1: '1',
  sculpture2: '2'
};
