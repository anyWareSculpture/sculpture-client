const matchesWildcard = require('wildcard');

export default class SerialManager {
  constructor() {
    this.patterns = {};
    this.ports = {};

    this._setupConnections();
  }

  /**
   * Dispatches the given command string to the appropriate serial ports.
   * @param {String} command - The command to dispatch
   * @returns {Boolean} Returns true if the command was dispatched to any port.
   */
  dispatchCommand(command) {
    const targetPorts = new Set();
    for (let pattern of Object.keys(this.patterns)) {
      const portId = this.patterns[pattern];
      if (matchesWildcard(pattern, command)) {
        targetPorts.add(portId);
      }
    }

    for (let portId of targetPorts) {
      const port = this.ports[portId];
      port.write(command);
    }

    return targetPorts.size === 0;
  }

  _setupConnections() {
    
  }
}