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
   * Called on power-up, after initializing all subsystems
   */
  reset() {
    this.resetDisks();
  }

  /**
   * Start homing the disks back to their original positions
   */
  resetDisks() {
    const commandString = SerialProtocolCommandBuilder.buildDiskReset();
    return this.serialManager.dispatchCommand(commandString);
  }

  _handleChanges(changes) {
    if (changes.hasOwnProperty('currentGame')) {
      // Reset on start or stop of playing the disk game
      if (this._previousGame === GAMES.DISK || changes.currentGame == GAMES.DISK) this.resetDisks();
      this._previousGame = changes.currentGame;
    }

    const diskChanges = changes.disks;
    if (!diskChanges) {
      return;
    }

    for (let diskId of Object.keys(diskChanges)) {
      const hardwareDiskId = this.disksHardware.ID_TO_HARDWARE_MAP[diskId];

      const newDiskValues = diskChanges[diskId];

      if (newDiskValues.hasOwnProperty('position') && 
          newDiskValues.position === this._previousHardwarePositions[diskId]) {
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
