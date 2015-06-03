const PATTERN_COMMAND = "PATTERN";

export class PatternCommand {
  /**
   * Parse a pattern command from the given data
   * @param {String} data - The string to parse
   */
  static parse(data) {
    const parts = data.split(/\s+/);
    if (parts[0] !== PATTERN_COMMAND) {
      throw new Error(`Command syntax error, unexpected command name ${parts[0]}`);
    }

    return parts.slice(1).map((numberString) => parseInt(numberString));
  }

  /**
   * Build a pattern command string from the given pattern
   * @param {String[]} pattern - The pattern to convert
   * @returns {String} The serial command to send
   */
  static build(pattern) {
    patternString = pattern.join(" ");
    return `${PATTERN_COMMAND} ${patternString}`;
  }
}
