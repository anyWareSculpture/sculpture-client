const {SculptureStore, DisksActionCreator, Disk} = require('@anyware/game-logic');

const SerialManager = require('../serial/serial-manager');
const serialProtocol = require('../serial/serial-protocol');
const {SerialProtocolCommandBuilder} = serialProtocol;

const MAX_RESET_ATTEMPTS = 5;
const DISK_ID_TO_HARDWARE_MAP = {
  disk0: "0",
  disk1: "1",
  disk2: "2"
};
const DISK_DIRECTION_TO_HARDWARE_MAP = {
  [Disk.CLOCKWISE]: -1,
  [Disk.COUNTERCLOCKWISE]: 1,
  [Disk.STOPPED]: 0,
  [Disk.CONFLICT]: 0
};

export default class DiskView {
  constructor(store, dispatcher, serialManager) {
    this.store = store;
    this.serialManager = serialManager;
    this.serialManager.on(SerialManager.EVENT_COMMAND, this._handleCommand.bind(this));

    this.disksActionCreator = new DisksActionCreator(dispatcher);

    this._animating = false;
    this._previousHardwarePositions = {};

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
    if (changes.hasOwnProperty('disk') && changes.disk.hasOwnProperty('level') || changes.currentGame === "disk") {
      this.resetDisks();
    }

    const diskChanges = changes.disks;
    if (!diskChanges) {
      return;
    }

    for (let diskId of Object.keys(diskChanges)) {
      const hardwareDiskId = DISK_ID_TO_HARDWARE_MAP[diskId];

      const newDiskValues = diskChanges[diskId];

      if (newDiskValues.position === this._previousHardwarePositions[diskId]) {
        continue;
      }
      const position = newDiskValues.position;

      const hardwareDirection = DISK_DIRECTION_TO_HARDWARE_MAP[newDiskValues.direction];

      const commandString = SerialProtocolCommandBuilder.buildDisk({
        diskId: hardwareDiskId,
        position: position,
        direction: hardwareDirection,
        user: newDiskValues.user
      });
      this.serialManager.dispatchCommand(commandString);
    }
  }

  _handleCommand(commandName, commandArgs) {
    if (commandName === serialProtocol.DISK_COMMAND) {
      let {diskId, position, direction} = commandArgs;
      diskId = this._lookupDiskIdFromHardware(diskId);
      position = parseInt(position);
      direction = this._lookupDirectionFromHardware(direction);

      if (!isNaN(position)) {
        this._previousHardwarePositions[diskId] = position;
      }

      this.disksActionCreator.sendDiskUpdate(diskId, {
        position: position,
        direction: direction
      });
    }
  }

  _lookupDiskIdFromHardware(hardwareDiskId) {
    for (let diskId of Object.keys(DISK_ID_TO_HARDWARE_MAP)) {
      if (DISK_ID_TO_HARDWARE_MAP[diskId] === hardwareDiskId) {
        return diskId;
      }
    }
  }

  _lookupDirectionFromHardware(hardwareDirection) {
    for (let direction of Object.keys(DISK_DIRECTION_TO_HARDWARE_MAP)) {
      if (DISK_DIRECTION_TO_HARDWARE_MAP[direction] === hardwareDirection) {
        return direction;
      }
    }
  }
}
