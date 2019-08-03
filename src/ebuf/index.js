'use strict';

const empty = Buffer.alloc(1);

class ExpandableBuffer{
  constructor(data=empty){
    if(data.length === 0) data = empty;

    this.buf = Buffer.from(data);
    this.len = 0;
  }

  reset(){
    this.buf = Buffer.from(empty);
    this.len = 0;
  }

  push(byte){
    if(this.len === this.buf.length)
      this.buf = Buffer.concat([this.buf, this.buf]);
    this.buf[this.len++] = byte;
    return this;
  }

  getBuf(){
    return Buffer.from(this.buf.slice(0, this.len));
  }
}

module.exports = ExpandableBuffer;