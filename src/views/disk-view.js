const {SculptureStore, MoleGameLogic, DisksActionCreator, Disk} = require('@anyware/game-logic');

const SerialManager = require('../serial/serial-manager');
const serialProtocol = require('../serial/serial-protocol');
const {SerialProtocolCommandParser, SerialProtocolCommandBuilder} = serialProtocol;

const MAX_RESET_ATTEMPTS = 5;
const DISK_ID_TO_HARDWARE_MAP = {
  disk0: "0",
  disk1: "1",
  disk2: "2"
};
const DISK_DIRECTION_TO_HARDWARE_MAP = {
  [Disk.CLOCKWISE]: -1,
  [Disk.COUNTERCLOCKWISE]: 1,
  [Disk.STOPPED]: 0
};

export default class DiskView {
  constructor(store, dispatcher, serialManager) {
    this.store = store;
    this.serialManager = serialManager;
    this.serialManager.on(SerialManager.EVENT_COMMAND, this._handleCommand.bind(this));

    this.disksActionCreator = new DisksActionCreator(dispatcher);

    this._animating = false;

    this.resetDisks();
    this.store.on(SculptureStore.EVENT_CHANGE, this._handleChanges.bind(this));
  }

  /**
   * Start homing the disks back to their original positions
   * Makes multiple attempts if it doesn't work the first time
   * @param {Number} maxAttempts - The maximum number of attempts that can be made
   */
  resetDisks(maxAttempts=MAX_RESET_ATTEMPTS) {
    let attempt = 0;

    const reset = () => {
      attempt += 1;

      const commandString = SerialProtocolCommandBuilder.buildDiskReset();
      const sent = this.serialManager.dispatchCommand(commandString);

      if (!sent && attempt < maxAttempts) {
        setTimeout(reset, 300);
      }
    };

    reset();
  }

  _handleChanges(changes) {
    //TODO: reset() when level changes

    const diskChanges = changes.disks;
    if (!diskChanges) {
      return;
    }

    for (let diskId of Object.keys(diskChanges)) {
      const hardwareDiskId = DISK_ID_TO_HARDWARE_MAP[diskId];

      const newDiskValues = diskChanges[diskId];

      const commandString = SerialProtocolCommandBuilder.buildDisk({
        diskId: hardwareDiskId,
        position: newDiskValues.position,
        direction: DISK_DIRECTION_TO_HARDWARE_MAP[newDiskValues.direction],
        user: newDiskValues.user
      });
      this.serialManager.dispatchCommand(commandString);
    }
  }

  _handleCommand(commandName, commandArgs) {
    console.log(`~#GOT DISK COMMAND: ${commandName} ${JSON.stringify(commandArgs)}`);
  }
}
