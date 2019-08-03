'use strict';

const EventEmitter = require('events');
const Ebuf = require('../ebuf');

let O = null;

class Process extends EventEmitter{
  constructor(_O, proc){
    super();

    O = _O;

    this.proc = proc;
    this.stdin = new Stdin(this, proc.stdin);

    proc.on('SIGINT', this.onSigint.bind(this));
  }

  onSigint(){
    this.emit('sigint');
  }

  exit(code){
    if(O.isElectron) setTimeout(() => window.close(), 500);
    else this.proc.exit(code);
  }
}

class Stdin extends EventEmitter{
  constructor(proc, stdin){
    super();

    this.proc = proc;
    this.stdin = stdin;

    stdin.on('data', this.onData.bind(this));
    stdin.on('end', this.onEnd.bind(this));

    this.refs = 0;

    if('unref' in stdin)
      stdin.unref();
  }

  ref(){
    if(this.refs++ === 0 && !O.isElectron)
      this.stdin.ref();
  }

  unref(){
    if(--this.refs === 0 && !O.isElectron)
      this.stdin.unref();
  }

  onData(data){
    var ebuf = new Ebuf();

    for(var byte of data){
      if(byte === 0x03){
        this.proc.onSigint();
        continue;
      }

      ebuf.push(byte);
    }

    this.emit('data', ebuf.getBuf());
  }

  onEnd(){
    this.emit('end');
  }
}

Process.Stdin = Stdin;

module.exports = Process;