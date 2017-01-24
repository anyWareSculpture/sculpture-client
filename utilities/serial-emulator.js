#!/usr/bin/env ./node_modules/.bin/babel-node
const blessed = require('blessed');

const spawn = require('child_process').spawn;
//const spawn = require('child-process-promise').spawn;
const SerialPort = require('serialport');
const readline = SerialPort.parsers.readline;
const username = require('username');

class SerialHandler {
  constructor(portconfig) {
    this.portconfig = portconfig;
    portconfig.port.on('data', this.inputHandler.bind(this));
  }

  inputHandler(line) {
    const key = line.trim().split(' ')[0];
    if (this.portconfig.handlers.hasOwnProperty(key)) {
      this.portconfig.port.write(this.portconfig.handlers[key]);
      this.portconfig.output(this.portconfig.handlers[key]);
    }
  }
}

const ports = {
  A: {
    path: '/dev/tty.usbserial0',
    device: 'A',
    handlers: {
      'HELLO': `HELLO panel\nSUPPORTED\nPANEL-SET 0\nPANEL-PULSE 0\nPANEL-INTENSITY 0\nPANEL-ANIMATE\nPANEL-STATE\nENDSUPPORTED\n`,
    },
  },
  B: {
    path: '/dev/tty.usbserial1',
    device: 'B',
    handlers: {
      'HELLO': `HELLO panel\nSUPPORTED\nPANEL-SET 1\nPANEL-PULSE 1\nPANEL-INTENSITY 1\nPANEL-ANIMATE\nPANEL-STATE\nENDSUPPORTED\n`,
    },
  },
  C: {
    path: '/dev/tty.usbserial2',
    device: 'C',
    handlers: {
      'HELLO': `HELLO panel\nSUPPORTED\nPANEL-SET 2\nPANEL-PULSE 2\nPANEL-INTENSITY 2\nPANEL-ANIMATE\nPANEL-STATE\nENDSUPPORTED\n`,
    },
  },
  M: {
    path: '/dev/tty.usbserial3',
    device: 'M',
    handlers: {
      'HELLO': `HELLO handshake\nSUPPORTED\nPANEL-SET [356]\nPANEL-PULSE [356]\nPANEL-INTENSITY [356]\nHANDSHAKE\nENDSUPPORTED\n`,
    },
  },
};

let activePort;

main();

let screen;

async function main() {
  setupSimulatedPorts();
  setTimeout(() => {
    screen = setupScreen();
    screen.render();
    setupPorts();
    setupInput();
  }, 2000);
}

function setupSimulatedPorts() {
  const user = 'kintel';
  for (let key of Object.keys(ports)) {
    const portconfig = ports[key];
    const cmd = 'socat';
    const args= ['-d', '-d', `pty,rawer,link=${portconfig.path},user=${user},mode=0666`, `pty,rawer,echo=1,link=${portconfig.path}ctrl,user=${user}`];
    console.log(`Setting up ${portconfig.path}`);
    console.log(cmd, args.join(' '));
    spawn(cmd, args, {stdio: 'ignore'});
  }
}

function setupPorts() {
  blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '50%',
    height: 1,
    tags: true,
    content: '{center}{blue-fg}{bold}SERIAL OUTPUT{/bold}{/blue-fg}{/center}'
  });
  blessed.box({
    parent: screen,
    top: 0,
    left: '50%',
    width: '50%',
    height: 1,
    tags: true,
    content: '{center}{blue-fg}{bold}SERIAL INPUT{/bold}{/blue-fg}{/center}'
  });
  const numPorts = Object.keys(ports).length;
  const height = Math.trunc(screen.height/numPorts) - 1;
  for (let i=0;i<numPorts;i++) {
    const serialbox = blessed.box({
      parent: screen,
      top: i*height+1,
      left: 0,
      width: '100%',
      height: height,
      tags: true,
    });
    loadSerialPort(serialbox, ports[Object.keys(ports)[i]], (error) => {
      setActivePort(Object.keys(ports)[i]);
      screen.render();
    });
  }
}

function setupInput() {
  blessed.text({
    parent: screen,
    bottom: 0,
    left: 0,
    bg: '#888888',
    content: ">"
  });
  const serialInputBox = blessed.textarea({
    parent: screen,
    bottom: 0,
    left: 1,
    width: '100%-2',
    height: 1,
    inputOnFocus: true,
    mouse: true,
    bg: '#888888',
    hover: {
      bg: '#AAAAAA'
    }
  });
  serialInputBox.key('enter', () => {
    let serial = serialInputBox.getValue();
    serialInputBox.setValue('');
    
    ports[activePort].port.write(serial.trim() + '\r\n');
    
    if (serial.endsWith('\n')) {
      serial = serial.slice(0, -1);
    }
    ports[activePort].output(serial);
  });
  serialInputBox.key(['f1'], () => setActivePort('A'));
  serialInputBox.key(['f2'], () => setActivePort('B'));
  serialInputBox.key(['f3'], () => setActivePort('C'));
  serialInputBox.key(['f4'], () => setActivePort('M'));
  serialInputBox.focus();
}

function setActivePort(portid) {
  if (activePort) {
    ports[activePort].active = false;
    updateStatus(ports[activePort]);
  }
  activePort = portid;
  ports[activePort].active = true;
  updateStatus(ports[activePort]);
}

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

function loadSerialPort(parent, portconfig, callback) {
  portconfig.port = new SerialPort(portconfig.path+'ctrl', {
    baudrate: 115200,
    autoOpen: false,
    parser: readline('\n'),
  });

  portconfig.port.open((error) => {
    setupPortInterface(parent, portconfig);
    callback(error);
  });
}

function setupPortInterface(parent, portconfig) {
  setupStatusBar(parent, portconfig);

  portconfig.input = setupPortInputInterface(parent);
  portconfig.port.on('data', portconfig.input);
  portconfig.port.handler = new SerialHandler(portconfig);

  portconfig.output = setupPortOutputInterface(parent);
}

function updateStatus(portconfig) {
  const openStatus = portconfig.port.isOpen() ? "{green-fg}connected{/green-fg}" : "{red-fg}disconnected{/red-fg}";
  const deviceStatus = portconfig.active ? `{bold}Port: ${portconfig.device}{/bold}` : `Port: ${portconfig.device}`;
  const status = ` ${deviceStatus}{|}${openStatus} `;
  portconfig.statusBar.setContent(status);
  screen.render();
}

function setupStatusBar(parent, portconfig) {
  portconfig.statusBar = blessed.box({
    parent: parent,
    top: 0,
    left: 0,
    width: '100%',
    height: 1,
    tags: true
  });
  updateStatus(portconfig);

  portconfig.port.on('close', () => updateStatus(portconfig));
}

function setupPortOutputInterface(parent) {
  const outputLog = blessed.log({
    parent: parent,
    top: 1,
    left: 0,
    width: '50%-1',
    height: 'shrink',
    tags: true,
    mouse: true,
    style: {
      fg: 'white',
      bg: 'gray'
    }
  });

  return (line) => {
    const time = formattedTime();
    outputLog.log(`{blue-fg}{bold}${time}{/bold}{/blue-fg} ${line}`);
  };
}

function setupPortInputInterface(parent) {
  const inputLog = blessed.log({
    parent: parent,
    top: 1,
    left: '50%',
    width: '50%',
    height: 'shrink',
    tags: true,
    mouse: true,
    style: {
      fg: 'white',
      bg: 'gray'
    }
  });
  return (line) => {
    const time = formattedTime();
    inputLog.log(`{blue-fg}{bold}${time}{/bold}{/blue-fg} ${line}`);
  };
}

function formattedTime() {
  const currentDate = new Date();
  const time = currentDate.toTimeString().split(' ')[0];
  return `[${time}]`;
}
