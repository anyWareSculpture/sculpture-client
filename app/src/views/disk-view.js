const SculptureStore = require('@anyware/game-logic/lib/sculpture-store');
const DisksActionCreator = require('@anyware/game-logic/lib/actions/disks-action-creator');
const Disk = require('@anyware/game-logic/lib/utils/disk');
const GAMES = require('@anyware/game-logic/lib/constants/games');

const SerialManager = require('../serial/serial-manager');
const serialProtocol = require('../serial/serial-protocol');
const {SerialProtocolCommandBuilder} = serialProtocol;

const STATE_TUTORIAL_SETUP = "tutorial-setup";
const STATE_TUTORIAL = "tutorial";
const STATE_READY = "ready";

export default class DiskView {
  constructor(store, config, dispatcher, serialManager) {
    this.store = store;
    this.config = config;
    this.disksHardware = this.config.DISKS_HARDWARE;
    this.serialManager = serialManager;
    this.serialManager.on(SerialManager.EVENT_COMMAND, this._handleCommand.bind(this));

    this.disksActionCreator = new DisksActionCreator(dispatcher);

    this._state = STATE_READY;
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

    //TODO: Do this every time we loop through the games
    this._state = STATE_TUTORIAL_SETUP;
  }

  /**
   * Start homing the disks back to their original positions
   */
  resetDisks() {
    const commandString = SerialProtocolCommandBuilder.buildDiskReset();
    return this.serialManager.dispatchCommand(commandString);
  }

  _handleChanges(changes) {
    //TODO: Break up this method
    //TODO: Make a DiskStack class and add methods like allReady to it
    //TODO: Check to make sure we aren't using Object.keys on any TrackedData (use Array.from) instead.
    //TODO: Incorporate this into game logic instead (significant refactor)
    //TODO: - Add homing to the game logic + check for that change here and send DISK-RESET when it happens
    console.debug("changes:", changes);
    if (this._state === STATE_TUTORIAL_SETUP) {
      //TODO: Must be a better way to get this (maybe from the game logic?)
      const {disks: disksSolution, perimeter} = this.config.DISK_GAME.LEVELS[0];

      const disks = this.disks;
      // This position is reasonably close
      const distance = this.config.DISK_GAME.TUTORIAL_DISTANCE;
      //TODO: This code is craziness...
      let allDisksSynced = true;
      for (let diskId of disks) {
        const disk = disks.get(diskId);
        if (!disk.isReady) {
          console.debug("not ready", diskId, disk.getState());
          allDisksSynced = false;
          continue;
        }
        console.debug("ready", diskId, disk.getState());

        const targetPosition = disksSolution[diskId] - distance;
        console.debug("target:", targetPosition);
        console.debug("current:", disk.getPosition());
        if (disk.getPosition() !== targetPosition) {
          allDisksSynced = false;

          const hardwareDiskId = this.disksHardware.ID_TO_HARDWARE_MAP[diskId];
          const direction = disk.directionTo(targetPosition);
          const hardwareDirection = this.disksHardware.DIRECTION_TO_HARDWARE_MAP[direction];
          const commandString = SerialProtocolCommandBuilder.buildDisk({
            diskId: hardwareDiskId,
            position: targetPosition,
            direction: hardwareDirection
          });
          console.debug(disk);
          console.debug(disk.getState());
          console.debug("sent:", commandString);
          this.serialManager.dispatchCommand(commandString);
        }
      }

      if (allDisksSynced) {
        console.debug("ALL SYNCED");
        console.debug(disks);
        this._state = STATE_TUTORIAL;
      }
      return;
    }

    if (changes.hasOwnProperty('currentGame')) {
      // Reset on start of playing the disk game
      if (changes.currentGame == GAMES.DISK) {
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
    else if (commandName === serialProtocol.DISK_STATE_COMMAND) {
      let {diskId, state} = commandArgs;
      diskId = this._lookupDiskIdFromHardware(diskId);
      state = this._lookupStateFromHardware(state);

      this.disksActionCreator.sendDiskUpdate(diskId, {
        state: state
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

  _lookupStateFromHardware(hardwareState) {
    for (let state of Object.keys(this.disksHardware.STATE_TO_HARDWARE_MAP)) {
      if (this.disksHardware.STATE_TO_HARDWARE_MAP[state] === hardwareState) {
        return state;
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
