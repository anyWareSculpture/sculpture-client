export const HELLO_COMMAND = "HELLO";
export const ERROR_COMMAND = "ERROR";
export const DEBUG_COMMAND = "DEBUG";
export const SUPPORTED_COMMAND = "SUPPORTED";
export const END_SUPPORTED_COMMAND = "ENDSUPPORTED";
export const IDENTITY_COMMAND = "IDENTITY";
export const PANEL_COMMAND = "PANEL";
export const PANEL_SET_COMMAND = "PANEL-SET";
export const PANEL_PULSE_COMMAND = "PANEL-PULSE";
export const DISK_COMMAND = "DISK";
export const DISK_RESET_COMMAND = "DISK-RESET";
export const DISK_STATE_COMMAND = "DISK-STATE";

const DISK_ARG_POSITION = "POS";
const DISK_ARG_DIRECTION = "DIR";
const DISK_ARG_USER = "USER";

export class SerialProtocolCommandParser {
  /**
   * Parse a command string and return its command name and data
   * @param {String} commandString - The serial command to parse
   * @returns {Object} - Two keys: 1. name - the name of the command, 2. data - other data as provided by that command's specific parser
   */
  static parse(commandString) {
    let commandName, commandArgs;
    [commandName, ...commandArgs] = commandString.trim().split(/\s+/);
    commandName = commandName.toUpperCase();

    const parserFunctions = {
      [HELLO_COMMAND]: SerialProtocolCommandParser.parseHelloArguments,
      [ERROR_COMMAND]: SerialProtocolCommandParser.parseErrorArguments,
      [DEBUG_COMMAND]: SerialProtocolCommandParser.parseDebugArguments,
      [SUPPORTED_COMMAND]: SerialProtocolCommandParser.parseSupportedArguments,
      [END_SUPPORTED_COMMAND]: SerialProtocolCommandParser.parseEndSupportedArguments,
      [IDENTITY_COMMAND]: SerialProtocolCommandParser.parseIdentityArguments,
      [PANEL_COMMAND]: SerialProtocolCommandParser.parsePanelArguments,
      [PANEL_SET_COMMAND]: SerialProtocolCommandParser.parsePanelSetArguments,
      [PANEL_PULSE_COMMAND]: SerialProtocolCommandParser.parsePanelPulseArguments,
      [DISK_COMMAND]: SerialProtocolCommandParser.parseDiskArguments,
      [DISK_RESET_COMMAND]: SerialProtocolCommandParser.parseDiskResetArguments,
      [DISK_STATE_COMMAND]: SerialProtocolCommandParser.parseDiskStateArguments
    };

    const parserFunction = parserFunctions[commandName];
    if (!parserFunction) {
      throw new Error(`Unrecognized command name '${commandName}'`);
    }

    return {
      name: commandName,
      data: parserFunction(commandArgs)
    };
  }

  static parseHelloArguments(args) {
    return {supportedGames: args};
  }

  static parseErrorArguments(args) {
    return {message: args.join(" ") || ""};
  }

  static parseDebugArguments(args) {
    return {message: args.join(" ") || ""};
  }

  static parseSupportedArguments() {
    return {};
  }

  static parseEndSupportedArguments() {
    return {};
  }

  static parseIdentityArguments(args) {
    return {identity: args[0]};
  }

  static parsePanelArguments(args) {
    return {stripId: args[0], panelId: args[1], pressed: args[2]};
  }

  static parsePanelSetArguments(args) {
    const [stripId, panelId, intensity, color, easing, duration] = args;
    return {stripId, panelId, intensity, color, easing, duration};
  }

  static parsePanelPulseArguments(args) {
    const [stripId, panelId, intensity, color, easing, duration] = args;
    return {stripId, panelId, intensity, color, easing, duration};
  }

  static parseDiskArguments(args) {
    // Format: {diskId: ..., position: ..., direction: ..., user: ...}
    // Any of these properties can be omitted except for diskId which should
    // always be there but might be undefined or null
    const parsed = {};

    const argValues = args.values();
    parsed.diskId = argValues.next();

    let arg;
    let iteration = argValues.next();
    while (!iteration.done) {
      arg = iteration.value;

      let propertyToSet = null;
      if (arg === DISK_ARG_POSITION) {
        propertyToSet = "position";
      }
      else if (arg === DISK_ARG_DIRECTION) {
        propertyToSet = "direction";
      }
      else if (arg === DISK_ARG_USER) {
        propertyToSet = "user";
      }
      else {
        throw new Error(`Unrecognized argument to DISK command: ${arg}`);
      }

      iteration = argValues.next();
      parsed[propertyToSet] = iteration.value;
      iteration = argValues.next();
    }

    return parsed;
  }

  static parseDiskResetArguments() {
    return {};
  }

  static parseDiskStateArguments(args) {
    return {diskId: args[0], state: args[1]};
  }
}

function removeOptionalParts(command) {
  let text = command.trim();
  if (!text.endsWith(" -")) {
    return text;
  }
  while (true) {
    const dashIndex = text.lastIndexOf(" -");
    if (dashIndex < 0) {
      break;
    }
    text = text.slice(0, dashIndex).trim();
  }
  return text;
}

export class SerialProtocolCommandBuilder {
  /**
   * Builds a command string from the given command name and data
   * @param {String} commandName - The name of the command to build, must be one of the recognized names exported as constants
   * @param {Object} commandData - The data to be passed to the appropriate command builder - this exactly matches the format returned by each parse method
   * @returns {String} The built command string
   */
  static build(commandName, commandData) {
    const builderFunctions = {
      [HELLO_COMMAND]: SerialProtocolCommandBuilder.buildHello,
      [ERROR_COMMAND]: SerialProtocolCommandBuilder.buildError,
      [DEBUG_COMMAND]: SerialProtocolCommandBuilder.buildDebug,
      [SUPPORTED_COMMAND]: SerialProtocolCommandBuilder.buildSupported,
      [END_SUPPORTED_COMMAND]: SerialProtocolCommandBuilder.buildEndSupported,
      [IDENTITY_COMMAND]: SerialProtocolCommandBuilder.buildIdentity,
      [PANEL_COMMAND]: SerialProtocolCommandBuilder.buildPanel,
      [PANEL_SET_COMMAND]: SerialProtocolCommandBuilder.buildPanelSet,
      [PANEL_PULSE_COMMAND]: SerialProtocolCommandBuilder.buildPanelPulse,
      [DISK_COMMAND]: SerialProtocolCommandBuilder.buildDisk,
      [DISK_RESET_COMMAND]: SerialProtocolCommandBuilder.buildDiskReset,
      [DISK_STATE_COMMAND]: SerialProtocolCommandBuilder.buildDiskState
    };

    const builderFunction = builderFunctions[commandName];

    if (!builderFunction) {
      throw new Error(`Unrecognized command name '${commandName}'`);
    }

    return builderFunction(commandData);
  }

  static buildHello(data) {
    return `${HELLO_COMMAND} ${data.supportedGames}\n`;
  }

  static buildError(data) {
    return `${ERROR_COMMAND} ${data.message || ""}\n`;
  }

  static buildDebug(data) {
    return `${DEBUG_COMMAND} ${data.message || ""}\n`;
  }

  static buildSupported() {
    return `${SUPPORTED_COMMAND}\n`;
  }

  static buildEndSupported() {
    return `${END_SUPPORTED_COMMAND}\n`;
  }

  static buildIdentity(data) {
    return `${IDENTITY_COMMAND} ${data.identity}\n`;
  }

  static buildPanel(data) {
    return `${PANEL_COMMAND} ${data.stripId} ${data.panelId} ${data.pressed}\n`;
  }

  static buildPanelSet(data) {
    let command = `${PANEL_SET_COMMAND} ${data.stripId} ${data.panelId} ${data.intensity} ${data.color || "-"} ${data.easing || "-"} ${data.duration || ""}`;

    command = removeOptionalParts(command);

    return `${command}\n`;
  }

  static buildPanelPulse(data) {
    let command = `${PANEL_PULSE_COMMAND} ${data.stripId} ${data.panelId} ${data.intensity} ${data.color || "-"} ${data.easing || "-"} ${data.duration || ""}`;

    command = removeOptionalParts(command);

    return `${command}\n`;
  }

  static buildDisk(data) {
    let command = `${DISK_COMMAND}`;
    if (data.hasOwnProperty("position") && data.position !== null) {
      command += `${DISK_ARG_POSITION} ${data.position}`;
    }
    if (data.hasOwnProperty("direction") && data.direction !== null) {
      command += `${DISK_ARG_DIRECTION} ${data.direction}`;
    }
    if (data.hasOwnProperty("user") && data.user !== null) {
      command += `${DISK_ARG_USER} ${data.user}`;
    }

    return `${command}\n`;
  }

  static buildDiskReset() {
    return `${DISK_RESET_COMMAND}\n`;
  }

  static buildDiskState(data) {
    return `${DISK_STATE_COMMAND} ${data.diskId} ${data.state}`;
  }
}
