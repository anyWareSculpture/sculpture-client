export const HELLO_COMMAND = "HELLO";
export const ERROR_COMMAND = "ERROR";
export const DEBUG_COMMAND = "DEBUG";
export const SUPPORTED_COMMAND = "SUPPORTED";
export const END_SUPPORTED_COMMAND = "ENDSUPPORTED";
export const IDENTITY_COMMAND = "IDENTITY";

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
      [IDENTITY_COMMAND]: SerialProtocolCommandParser.parseIdentityArguments
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
    return {message: args[0] || ""};
  }

  static parseDebugArguments(args) {
    return {message: args[0] || ""};
  }

  static parseSupportedArguments(args) {
    return {};
  }

  static parseEndSupportedArguments(args) {
    return {};
  }

  static parseIdentityArguments(args) {
    return {identity: args[0]};
  }
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
      [IDENTITY_COMMAND]: SerialProtocolCommandBuilder.buildIdentity
    };

    const builderFunction = builderFunctions[commandName];

    if (!builderFunction) {
      throw new Error(`unrecognized command name '${commandName}'`);
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

  static buildSupported(data) {
    return `${SUPPORTED_COMMAND}\n`;
  }

  static buildEndSupported(data) {
    return `${END_SUPPORTED_COMMAND}\n`;
  }

  static buildIdentity(data) {
    return `${IDENTITY_COMMAND} ${data.identity}\n`;
  }
}
