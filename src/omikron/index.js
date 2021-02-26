'use strict';

const fs = require('fs');
const path = require('path');
const Process = require('./process');

const isElectron = 'navigator' in global;
if(isElectron) initElectron();

const cwd = __dirname;
const omikronScript = path.join(cwd, './omikron.js');

const dirs = {
  omikron: omikronScript,
};

class Window{
  constructor(){
    this.document = new Document();
  }
}

class Document{
  constructor(){}
}

module.exports = getFramework();

function getFramework(){
  var str = fs.readFileSync(omikronScript).toString().trim();
  str = str.split(/\r\n|\r|\n/);
  str[str.length - 1] = 'return O;';
  str = str.join('\n');

  var window = isElectron ? global : new Window();
  var {document} = window;

  var func = new Function('window', 'document', 'require', str);
  var O = func(window, document, getReq());

  O.init(0);

  O.dirs = dirs;
  init(O);

  return O;
}

function init(O){
  O.proc = new Process(O, process);
}

function initElectron(){
  const electron = require('electron');
  const ipc = electron.ipcRenderer;

  const {log, info, error} = console;

  console.log = (...args) => {
    log(...args);
    ipc.send('log', args);
  };

  console.info = (...args) => {
    info(...args);
    ipc.send('info', args);
  };

  console.error = (...args) => {
    error(...args);
    ipc.send('error', args);
  };

  console.logRaw = data => {
    ipc.send('logRaw', data);
  };

  let catched = 0;

  process.on('uncaughtException', err => {
    if(catched) return;
    catched = 1;

    if(err === null){
      err = O.ftext(`
        \n=== ERROR ===\n
        An unexpected error has occured somewhere, but we
        are unable to detect where exactly.
      `);
    }

    O.exit(err);
  });
}

function getReq(){
  if(isElectron) return require;

  return (...args) => {
    if(args.length !== 1)
      throw new TypeError('Expected 1 argument');

    var arg = args[0];
    if(typeof args[0] !== 'string')
      throw new TypeError('Expected a string');

    if(/[\.\/\\]/.test(arg))
      throw new TypeError('Expected a native module name');

    return require(arg);
  };
}