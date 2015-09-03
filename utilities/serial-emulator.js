const blessed = require('blessed');

const {SerialPort, parsers} = require("serialport");

const INSTRUCTIONS = 
  "{center}{bold}{yellow-fg}Welcome to the Serial Emulator!{/yellow-fg}{/bold}\n" +
  "Press {bold}{blue-fg}Ctrl-C{/blue-fg}{/bold} to quit.\n\n" +
  "Please enter the path of the serial port this program should read and write from and then press enter" +
  "{/center}";

const screen = setupScreen();

promptForSerialPort(screen);

screen.render();

function setupScreen() {
  const screen = blessed.screen({
    autoPadding: true,
    smartCSR: true,
    debug: true,
    dockBorders: true,
    ignoreLocked: ['C-c', 'f12']
  });
  screen.title = 'Serial Emulator';
  screen.key(['C-c'], (ch, key) => {
    return process.exit(0);
  });
  return screen;
}

function promptForSerialPort(screen) {
  const box = blessed.box({
    parent: screen,
    top: 2,
    left: 'center',
    width: '70%',
    height: 12,
    padding: 1,
    content: INSTRUCTIONS,
    tags: true,
    border: {
      type: 'line'
    },
    style: {
      fg: 'white',
      bg: 'grey',
      border: {
        fg: '#f0f0f0'
      }
    }
  });

  const serialPortPathInput = blessed.textarea({
    parent: box,
    bottom: 0,
    left: 'center',
    width: '80%',
    height: 1,
    mouse: true,
    inputOnFocus: true,
    value: process.argv[2] || "",
    style: {
      bg: '#888888',
      hover: {
        bg: '#AAAAAA'
      }
    }
  });
  serialPortPathInput.focus();
  serialPortPathInput.key('enter', () => {
    loadSerialPort(screen, serialPortPathInput.getValue().trim());
    box.remove(serialPortPathInput);
    screen.remove(box);

    screen.render();
  });
}

function loadSerialPort(screen, path) {
  const loadingConsole = blessed.log({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    content: 'Loading...',
    mouse: true,
    tags: true
  });
  loadingConsole.log(`Attempting to open serial port path: {blue-fg}{bold}${path}{/bold}{/blue-fg}`);

  const port = new SerialPort(path, {
    baudrate: 115200,
    parser: parsers.readline("\n")
  }, false);
  port.open((error) => {
    if (error) {
      loadingConsole.log('');
      loadingConsole.log(`{bold}{red-fg}${error}{/red-fg}{/bold}`);
      loadingConsole.log(`{bold}An error occurred. Please press Ctrl-C to quit and try again.{/bold}`);

      return;
    }

    screen.remove(loadingConsole);
    setupPortInterface(screen, port);
    screen.render();
  });
}

function setupPortInterface(screen, port) {
  setupStatusBar(screen, port);

  setupPortInputInterface(screen, (input) => port.write(input));

  const outputHandler = setupPortOutputInterface(screen);
  port.on('data', outputHandler);
}

function setupStatusBar(screen, port) {
  const statusBar = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: 1,
    tags: true
  });
  const updateStatus = () => {
    const openStatus = port.isOpen() ? "{green-fg}connected{/green-fg}" : "{red-fg}disconnected{/red-fg}";
    const status = ` Port: ${port.path}{|}${openStatus} `
    statusBar.setContent(status);
  };
  updateStatus();

  port.on('close', updateStatus);
}

function setupPortInputInterface(screen, inputHandler) {
  const inputContainer = blessed.box({
    parent: screen,
    top: 1,
    left: 0,
    width: '50%',
    height: '100%-1',
    border: {
      type: 'line',
    },
    tags: true,
    content: '{center}{blue-fg}{bold}SERIAL INPUT{/bold}{/blue-fg}{/center}'
  });
  const inputLog = blessed.log({
    parent: inputContainer,
    top: 1,
    left: 0,
    width: '100%-2',
    height: 'shrink',
    tags: true,
    mouse: true,
    style: {
      fg: 'white',
      bg: 'gray'
    }
  });
  blessed.text({
    parent: inputContainer,
    bottom: 0,
    left: 0,
    bg: '#888888',
    content: ">"
  });
  const serialInput = blessed.textarea({
    parent: inputContainer,
    bottom: 0,
    left: 1,
    width: '100%-3',
    height: 1,
    inputOnFocus: true,
    mouse: true,
    bg: '#888888',
    hover: {
      bg: '#AAAAAA'
    }
  });
  serialInput.focus();
  serialInput.key('enter', () => {
    let serial = serialInput.getValue();
    serialInput.setValue('');

    inputHandler(serial);

    if (serial.endsWith('\n')) {
      serial = serial.slice(0, -1);
    }
    const time = formattedTime();
    inputLog.log(`{blue-fg}{bold}${time}{/bold}{/blue-fg} ${serial}`);
  });
}

function setupPortOutputInterface(screen) {
  const outputContainer = blessed.box({
    parent: screen,
    top: 1,
    left: '50%',
    width: '50%',
    height: '100%-1',
    border: {
      type: 'line',
    },
    tags: true,
    content: '{center}{blue-fg}{bold}SERIAL OUTPUT{/bold}{/blue-fg}{/center}'
  });
  const outputConsole = blessed.log({
    parent: outputContainer,
    top: 1,
    left: 0,
    width: '100%-2',
    height: 'shrink',
    tags: true,
    mouse: true,
    style: {
      fg: 'white',
      bg: 'gray'
    }
  });
  return (output) => {
    const time = formattedTime();
    for (let line of output.split('\n')) {
      outputConsole.log(`{blue-fg}{bold}${time}{/bold}{/blue-fg} ${line}`);
    }
  }
}

function formattedTime() {
  const currentDate = new Date();
  const time = currentDate.toTimeString().split(' ')[0];
  return `[${time}]`;
}

