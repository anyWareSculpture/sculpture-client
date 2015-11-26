export class SerialCommand {
  static _name = null;
  // A set of all appropriate command names (for aliasing)
  static _names = null;
  // A list of all the fields found in this command in sequence
  static _fields = [];
  // The separator between commands
  static _delimiter = " ";
  // The ending appended to the command when built and the string that indicates the end of the command when parsing
  static _ending = "\n";

  static define(commandName) {
    return class _ extends SerialCommand {
      static _name = commandName;
      static _names = new Set([commandName]);
    };
  }

  static alias(aliasName) {
    this._ensureSubclass();
    this._names.add(aliasName);
    return this;
  }

  static delimiter(delimiter) {
    this._ensureSubclass();
    this._delimiter = delimiter;
    return this;
  }

  static endWith(ending) {
    this._ensureSubclass();
    this._ending = ending;
    return this;
  }

  static addField(field) {
    this._ensureSubclass();
    this._fields.push(field);
    return this;
  }

  static fields(fieldsList) {
    fieldsList.forEach(this.addField.bind(this));
    return this;
  }

  static parse(data) {
  }

  static _ensureSubclass() {
    if (this === SerialCommand || this instanceof SerialCommand) {
      throw new Error("Use SerialCommand.define() or subclass SerialCommand before using this method");
    }
  }

  constructor(values) {
    this.constructor._fields.forEach(function(fieldName) {
      this[fieldName] = values[fieldName];
    });
  }

  build(values) {
  }
}

export class Field {
  constructor(name, options={}) {
    this.name = name;
    this.options = Object.assign({
      required: true,
      default: "",
      choices: null
    }, options);
  }
  
  default(value) {
    this.options.default = value;
    return this;
  }
  
  required() {
    this.options.required = true;
    return this;
  }
  
  optional() {
    this.options.required = false;
    return this;
  }
  
  choices(fieldChoices) {
    this.options.choices = Object.assign(this.options.choices || {}, fieldChoices);
    return this;
  }
  
  parse(words) {
    // parse out the contents of this field and mutate words
    // words was split by SerialCommand.delimiter
    if (this.options.required && !words.length) {
      throw new Error(`Required field ${this.name} not provided`);
    }
    return words.pop(0) || this.default;
  }
  
  build(values) {
    // build a string representation of this field
    if (this.options.required && !values.hasOwnProperty(this.name)) {
      throw new Error(`Required field ${this.name} not provided`);
    }
    return values[this.name] || this.default;
  }
}

export class StringField extends Field {
}

export class NumberField extends Field {
  constructor(name, options={}) {
    super(name, {
      default: 0,
      min: -Infinity,
      max: Infinity
    }, options);
  }
  
  min(value) {
    this.options.min = value;
    return this;
  }
  
  max(value) {
    this.options.max = value;
    return this;
  }
  
  range(min, max) {
    return this.min(min).max(max);
  }
  
  parse(data) {
    const result = parseFloat(super.parse(data));
    this._assertInRange(result);
    return result;
  }
  
  build(values) {
    const result = super.build(values).toString();
    this._assertInRange(values[this.name]);
    return result;
  }
  
  _assertInRange(value) {
    if (isNaN(value) || value < this.options.min || value > this.options.max) {
      throw new Error(`Number value '${value}' out of range or not a number`);
    }
  }
}
