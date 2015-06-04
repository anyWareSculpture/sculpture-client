export const HELLO_COMMAND = "HELLO";
export const ERROR_COMMAND = "ERROR";
export const DEBUG_COMMAND = "DEBUG";
export const RESET_COMMAND = "RESET";
export const INIT_COMMAND = "INIT";
export const EXIT_COMMAND = "EXIT";
export const PATTERN_COMMAND = "PATTERN";

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
      [RESET_COMMAND]: SerialProtocolCommandParser.parseResetArguments,
      [INIT_COMMAND]: SerialProtocolCommandParser.parseInitArguments,
      [EXIT_COMMAND]: SerialProtocolCommandParser.parseExitArguments,
      [PATTERN_COMMAND]: SerialProtocolCommandParser.parsePatternArguments
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

  static parseResetArguments(args) {
    return {debug: args[0]};
  }

  static parseInitArguments(args) {
    return {
      game: args[0],
      userId: args[1] || ""
    };
  }

  static parseExitArguments(args) {
    return {game: args};
  }

  static parsePatternArguments(args) {
    return {
      pattern: args.map((numberString) => parseInt(numberString))
    };
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
      [RESET_COMMAND]: SerialProtocolCommandBuilder.buildReset,
      [INIT_COMMAND]: SerialProtocolCommandBuilder.buildInit,
      [EXIT_COMMAND]: SerialProtocolCommandBuilder.buildExit,
      [PATTERN_COMMAND]: SerialProtocolCommandBuilder.buildPattern
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

  static buildReset(data) {
    return `${RESET_COMMAND} ${data.debug ? "1" : "0"}\n`;
  }

  static buildInit(data) {
    return `${INIT_COMMAND} ${data.game} ${data.userId || ""}\n`;
  }

  static buildExit(data) {
    return `${EXIT_COMMAND} ${data.game}\n`;
  }

  static buildPattern(data) {
    return `${PATTERN_COMMAND} ${data.pattern.join(" ")}\n`;
  }
}
