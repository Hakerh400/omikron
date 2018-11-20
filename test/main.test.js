'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('..');

const cwd = __dirname;

describe('String functions', () => {
  it('Creates enhanced log function', () => {
    assert.ok(typeof global.log === 'function');
  });

  it('Splits string at new lines', () => {
    var str = 'ab\nc\r\ndd\n\ne\r';
    assert.strictEqual(O.sanl(str).join(','), 'ab,c,dd,,e,');
    assert.strictEqual(O.sanll(str).join(','), 'ab\nc\r\ndd,e\r');
  });

  it('Capitalizes string', () => {
    var str = 'abCd';
    assert.strictEqual(O.cap(str), 'AbCd');
    assert.strictEqual(O.cap(str, 0), 'AbCd');
    assert.strictEqual(O.cap(str, 1), 'Abcd');
  });

  it('Indents string', () => {
    var str = 'abc';
    assert.strictEqual(O.indent(str, 0), 'abc');
    assert.strictEqual(O.indent(str, 1), '  abc');
    assert.strictEqual(O.indent(str, 2), '    abc');
  });
});

describe('Array functions', () => {
  it('Creates array', () => {
    var arr = O.ca(3, i => i + 2);
    assert.ok(Array.isArray(arr));
    assert.strictEqual(arr.length, 3);
    assert.strictEqual(arr.join(','), '2,3,4');
  });

  it('Creates array asynchronously', done => {
    O.caa(4, i => new Promise(res => {
      setTimeout(() => res(i - 1));
    })).then(arr => {
      assert.ok(Array.isArray(arr));
      assert.strictEqual(arr.length, 4);
      assert.strictEqual(arr.join(','), '-1,0,1,2');
      done();
    });
  });

  it('Shuffles array', () => {
    var arr = [...'abc'];
    var permutations = new Set();
    var maxSteps = 1e3;

    assert.ok(Array.isArray(O.shuffle(arr)));

    for(var i = 0; i !== maxSteps; i++){
      O.shuffle(arr);
      permutations.add(arr.join(''));
      if(permutations.size === 6) break;
    }

    assert.strictEqual(permutations.size, 6);
  });

  it('Flattens array', () => {
    var arr = [[1, 2], [3, [4, [[5]], [6], [[]], [], 7]], 8];
    var flatten = O.flatten(arr);

    assert.ok(Array.isArray(flatten));
    assert.strictEqual(flatten.length, 8);

    flatten.forEach((val, index) => {
      assert.strictEqual(val, index + 1);
    })
  });

  it('Gets the last element of array', () => {
    var arr = [1, 103, '57', 12];
    assert.strictEqual(O.last(arr), 12);
    arr.pop()
    assert.strictEqual(O.last(arr), '57');
    arr.length++;
    assert.strictEqual(O.last(arr), undefined);
  });
});

describe('Random number generator', () => {
  it('Generates random double between 0 and 1', () => {
    var vals = new Set();
    var maxSteps = 1e3;

    for(var i = 0; i !== maxSteps; i++){
      var val = O.random();
      assert.strictEqual(typeof val, 'number');
      assert.ok(val >= 0);
      assert.ok(val < 1);
      vals.add(val);
      if(vals.size === 50) break;
    }
    assert.strictEqual(vals.size, 50);
  });

  it('Generates random integer in custom range', () => {
    var vals = new Set();
    var maxSteps = 1e3;

    for(var i = 0; i !== maxSteps; i++){
      var val = O.rand(3, 7);
      assert.strictEqual(typeof val, 'number');
      assert.strictEqual(val | 0, val);
      assert.ok(val >= 3);
      assert.ok(val <= 7);
      vals.add(val);
      if(vals.size === 5) break;
    }
    assert.strictEqual(vals.size, 5);
  });

  it('Generates random double in custom range', () => {
    var vals = new Set();
    var maxSteps = 1e3;

    for(var i = 0; i !== maxSteps; i++){
      var val = O.randf(7, 7.5);
      assert.strictEqual(typeof val, 'number');
      assert.ok(val >= 7);
      assert.ok(val < 7.5);
      vals.add(val);
      if(vals.size === 50) break;
    }
    assert.strictEqual(vals.size, 50);
  });

  it('Generates random unbounded integer', () => {
    var vals = new Set();
    var maxSteps = 1e3;

    for(var i = 0; i !== maxSteps; i++){
      var val = O.randInt(10, .9);
      assert.strictEqual(typeof val, 'number');
      assert.ok(val >= 10);
      vals.add(val);
      if(vals.size === 5) break;
    }
    assert.strictEqual(vals.size, 5);
  });

  it('Selects random element from array', () => {
    var arr = [{}, {}, {}, {}];
    var vals = new Set();
    var maxSteps = 1e3;

    for(var i = 0; i !== maxSteps; i++){
      var val = O.randElem(arr);
      assert.strictEqual(typeof val, 'object');
      vals.add(val);
      if(vals.size === 4) break;
    }
    assert.strictEqual(vals.size, 4);

    vals = new Set();
    for(var i = 0; i !== 4; i++){
      var val = O.randElem(arr, 1);
      assert.strictEqual(arr.length, 3 - i);
      assert.strictEqual(typeof val, 'object');
      vals.add(val);
    }
    assert.strictEqual(vals.size, 4);
  });
});

describe('Other functions', () => {
  it('Repeats function', () => {
    var arr = [];

    O.repeat(5, i => {
      assert.strictEqual(typeof i, 'number');
      arr.push(i);
    });
    assert.strictEqual(arr.length, 5);
    assert.strictEqual(arr.join(','), '0,1,2,3,4');
  });

  it('Repeats function asynchronously', done => {
    var arr = [];

    O.repeata(4, i => new Promise(res => {
      assert.strictEqual(typeof i, 'number');
      arr.push(i);
      setTimeout(res);
    })).then(() => {
      assert.strictEqual(arr.length, 4);
      assert.strictEqual(arr.join(','), '0,1,2,3');
      done();
    });
  });

  it('Bounds number', () => {
    assert.strictEqual(O.bound(5, 0, 10), 5);
    assert.strictEqual(O.bound(5, 5, 10), 5);
    assert.strictEqual(O.bound(5, 0, 5), 5);
    assert.strictEqual(O.bound(5, 7, 10), 7);
    assert.strictEqual(O.bound(5, 0, 3), 3);
    assert.strictEqual(O.bound(-5, 1, 7), 1);
    assert.strictEqual(O.bound(-5, -3, -1), -3);
    assert.strictEqual(O.bound(-5, -7, -6), -6);
    assert.strictEqual(O.bound(0, 1, 1), 1);
    assert.strictEqual(O.bound(1, 1, 1), 1);
    assert.strictEqual(O.bound(2, 1, 1), 1);
  });

  it('Converts value to integer', () => {
    assert.strictEqual(O.int(0), 0);
    assert.strictEqual(O.int(3), 3);
    assert.strictEqual(O.int(-5), -5);
    assert.strictEqual(O.int(11.73), 11);
    assert.strictEqual(O.int(-9.2), -9);
    assert.strictEqual(O.int(-9.9), -9);
    assert.strictEqual(O.int([1]), 0);
    assert.strictEqual(O.int({}), 0);
    assert.strictEqual(O.int(global), 0);

    var called = 0;
    var val = {
      valueOf(){ called = 1; throw new Error('valueOf'); },
      toString(){ called = 1; throw new Error('toString'); },
      [Symbol.toPrimitive](){ called = 1; throw new Error('Symbol.toPrimitive'); },
    };

    assert.strictEqual(O.int(val), 0);
    assert.strictEqual(called, 0);
  });

  it('Creates color from HSV', () => {
    var col1 = O.hsv(0);
    assert.ok(col1 instanceof Uint8Array);
    assert.strictEqual(col1.length, 3);
    assert.strictEqual(col1[0], 255);
    assert.strictEqual(col1[1], 0);
    assert.strictEqual(col1[2], 0);

    var col2 = O.hsv(1 / 6, col1);
    assert.strictEqual(col2, col1);
    assert.strictEqual(col2.length, 3);
    assert.strictEqual(col2[0], 255);
    assert.strictEqual(col2[1], 255);
    assert.strictEqual(col2[2], 0);

    assert.strictEqual(O.hsv(2 / 6).join(','), '0,255,0');
    assert.strictEqual(O.hsv(3 / 6).join(','), '0,255,255');
    assert.strictEqual(O.hsv(4 / 6).join(','), '0,0,255');
    assert.strictEqual(O.hsv(5 / 6).join(','), '255,0,255');
    assert.strictEqual(O.hsv(6 / 6).join(','), '255,0,0');
  });
});