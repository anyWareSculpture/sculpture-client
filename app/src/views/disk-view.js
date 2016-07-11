import SculptureStore from 'anyware/lib/game-logic/sculpture-store';
import DisksActionCreator from 'anyware/lib/game-logic/actions/disks-action-creator';
import GAMES from 'anyware/lib/game-logic/constants/games';

import SerialManager from '../serial/serial-manager';
import * as SerialProtocol from '../serial/serial-protocol');
const {SerialProtocolCommandBuilder} = SerialProtocol;

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

  get disks() {
    return this.store.data.get('disks');
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
      // Reset on start of playing the disk game
      if (changes.currentGame === GAMES.DISK || changes.currentGame === GAMES.HANDSHAKE) {
        this.resetDisks();
      }
      this._previousGame = changes.currentGame;
    }

    const diskChanges = changes.disks;
    if (!diskChanges) {
      return;
    }

    const disks = this.disks;
    for (let diskId of Object.keys(diskChanges)) {
      const hardwareDiskId = this.disksHardware.ID_TO_HARDWARE_MAP[diskId];

      const disk = disks.get(diskId);
      const newDiskValues = diskChanges[diskId];

      let position, direction, user;
      if (newDiskValues.hasOwnProperty('position') && newDiskValues.position !== this._previousHardwarePositions[diskId]) {
        position = newDiskValues.position;
      }
      else {
        // leave position undefined because sending a position that
        // is already set stops the disk

        // FIXME: This might not be the best way of solving this:
        // If the changes are discarded due to the above previousHardwarePosition check, and there
        // are no other changes, we don't need to send anything as it would be redundant.
        delete newDiskValues.position;
        if (Object.keys(newDiskValues).length === 0) continue;
      }
      if (newDiskValues.hasOwnProperty('direction')) {
        direction = newDiskValues.direction;
      }
      else {
        direction = disk.getDirection();
      }
      if (newDiskValues.hasOwnProperty('user')) {
        user = newDiskValues.user;
      }
      else {
        user = disk.getUser();
      }

      const hardwareDirection = this.disksHardware.DIRECTION_TO_HARDWARE_MAP[direction];

      const commandString = SerialProtocolCommandBuilder.buildDisk({
        diskId: hardwareDiskId,
        position: position,
        direction: hardwareDirection,
        user: user
      });
      this.serialManager.dispatchCommand(commandString);
    }
  }

  _handleCommand(commandName, commandArgs) {
    if (commandName === SerialProtocol.DISK_COMMAND) {
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
