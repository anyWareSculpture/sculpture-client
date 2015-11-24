const SculptureStore = require('@anyware/game-logic/lib/sculpture-store');
const DisksActionCreator = require('@anyware/game-logic/lib/actions/disks-action-creator');
const Disk = require('@anyware/game-logic/lib/utils/disk');
const GAMES = require('@anyware/game-logic/lib/constants/games');

const SerialManager = require('../serial/serial-manager');
const serialProtocol = require('../serial/serial-protocol');
const {SerialProtocolCommandBuilder} = serialProtocol;

export default class DiskView {
  constructor(store, config, dispatcher, serialManager) {
    this.store = store;
    this.config = config;
    this.disksHardware = this.config.DISKS_HARDWARE;
    this.serialManager = serialManager;
    this.serialManager.on(SerialManager.EVENT_COMMAND, this._handleCommand.bind(this));

    this.disksActionCreator = new DisksActionCreator(dispatcher);

    this._animating = false;
    this._previousHardwarePositions = {};
    this._previousGame = null;

    this.store.on(SculptureStore.EVENT_CHANGE, this._handleChanges.bind(this));
  }

  /**
   * Start homing the disks back to their original positions
   * Makes multiple attempts if it doesn't work the first time
   * @param {Number} maxAttempts - The maximum number greater than zero of attempts that can be made
   */
  resetDisks(maxAttempts) {
    maxAttempts = maxAttempts || this.disksHardware.MAX_RESET_ATTEMPTS;
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
    let shouldReset = false;
    // Reset on start or stop of playing the disk game
    if (changes.hasOwnProperty('currentGame')) {
      shouldReset = this._previousGame === GAMES.DISK || changes.currentGame == GAMES.DISK;
      this._previousGame = changes.currentGame;
    }
    // Reset on next level
    shouldReset = shouldReset || changes.hasOwnProperty('disk') && changes.disk.hasOwnProperty('level');
    if (shouldReset) this.resetDisks();

    const diskChanges = changes.disks;
    if (!diskChanges) {
      return;
    }

    for (let diskId of Object.keys(diskChanges)) {
      const hardwareDiskId = this.disksHardware.ID_TO_HARDWARE_MAP[diskId];

      const newDiskValues = diskChanges[diskId];

      if (newDiskValues.position === this._previousHardwarePositions[diskId]) {
        continue;
      }
      const position = newDiskValues.position;

      const hardwareDirection = this.disksHardware.DIRECTION_TO_HARDWARE_MAP[newDiskValues.direction];

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
    for (let diskId of Object.keys(this.disksHardware.ID_TO_HARDWARE_MAP)) {
      if (this.disksHardware.ID_TO_HARDWARE_MAP[diskId] === hardwareDiskId) {
        return diskId;
      }
    }
  }

  _lookupDirectionFromHardware(hardwareDirection) {
    for (let direction of Object.keys(this.disksHardware.DIRECTION_TO_HARDWARE_MAP)) {
      if (this.disksHardware.DIRECTION_TO_HARDWARE_MAP[direction] === hardwareDirection) {
        return direction;
      }
    }
  }
}
