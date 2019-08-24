'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const jstest = require('@hakerh400/jstest');
const O = require('..');

const ok = assert.ok;
const eq = assert.strictEqual;
const {part, test} = jstest;

part('String functions', () => {
  test('Creates enhanced log function', () => {
    ok(typeof global.log === 'function');
  });

  test('Splits string at new lines', () => {
    var str = 'ab\nc\r\ndd\n\ne\r';
    eq(O.sanl(str).join(','), 'ab,c,dd,,e,');
    eq(O.sanll(str).join(','), 'ab\nc\r\ndd,e\r');
  });

  test('Capitalizes string', () => {
    var str = 'abCd';
    eq(O.cap(str), 'AbCd');
    eq(O.cap(str, 0), 'AbCd');
    eq(O.cap(str, 1), 'Abcd');
  });

  test('Indents string', () => {
    var str = 'abc';
    eq(O.indent(str, 0), `${' '.repeat(0)}abc`);
    eq(O.indent(str, 1), `${' '.repeat(2)}abc`);
    eq(O.indent(str, 2), `${' '.repeat(4)}abc`);
  });
});

part('Array functions', () => {
  test('Creates array', () => {
    var arr = O.ca(3, i => i + 2);
    ok(Array.isArray(arr));
    eq(arr.length, 3);
    eq(arr.join(','), '2,3,4');
  });

  test('Creates array asynchronously', () => {
    return O.caa(4, i => new Promise(res => {
      setTimeout(() => res(i - 1));
    })).then(arr => {
      ok(Array.isArray(arr));
      eq(arr.length, 4);
      eq(arr.join(','), '-1,0,1,2');
    });
  });

  test('Shuffles array', () => {
    var arr = [...'abc'];
    var permutations = new Set();
    var maxSteps = 1e3;

    ok(Array.isArray(O.shuffle(arr)));

    for(var i = 0; i !== maxSteps; i++){
      O.shuffle(arr);
      permutations.add(arr.join(''));
      if(permutations.size === 6) break;
    }

    eq(permutations.size, 6);
  });

  test('Flattens array', () => {
    var arr = [[1, 2], [3, [4, [[5]], [6], [[]], [], 7]], 8];
    var flatten = O.flatten(arr);

    ok(Array.isArray(flatten));
    eq(flatten.length, 8);

    flatten.forEach((val, index) => {
      eq(val, index + 1);
    })
  });

  test('Gets the last element of array', () => {
    var arr = [1, 103, '57', 12];
    eq(O.last(arr), 12);
    arr.pop()
    eq(O.last(arr), '57');
    arr.length++;
    eq(O.last(arr), undefined);
  });
});

part('Other functions', () => {
  test('Repeats function', () => {
    var arr = [];

    O.repeat(5, i => {
      eq(typeof i, 'number');
      arr.push(i);
    });
    eq(arr.length, 5);
    eq(arr.join(','), '0,1,2,3,4');
  });

  test('Repeats function asynchronously', () => {
    var arr = [];

    return O.repeata(4, i => new Promise(res => {
      eq(typeof i, 'number');
      arr.push(i);
      setTimeout(res);
    })).then(() => {
      eq(arr.length, 4);
      eq(arr.join(','), '0,1,2,3');
    });
  });

  test('Calculates bounded number', () => {
    eq(O.bound(5, 0, 10), 5);
    eq(O.bound(5, 5, 10), 5);
    eq(O.bound(5, 0, 5), 5);
    eq(O.bound(5, 7, 10), 7);
    eq(O.bound(5, 0, 3), 3);
    eq(O.bound(-5, 1, 7), 1);
    eq(O.bound(-5, -3, -1), -3);
    eq(O.bound(-5, -7, -6), -6);
    eq(O.bound(0, 1, 1), 1);
    eq(O.bound(1, 1, 1), 1);
    eq(O.bound(2, 1, 1), 1);
  });

  test('Converts value to integer', () => {
    eq(O.int(0), 0);
    eq(O.int(3), 3);
    eq(O.int(-5), -5);
    eq(O.int(11.73), 11);
    eq(O.int(-9.2), -9);
    eq(O.int(-9.9), -9);
    eq(O.int([1]), 0);
    eq(O.int({}), 0);
    eq(O.int(global), 0);

    var called = 0;
    var val = {
      valueOf(){ called = 1; throw new Error('valueOf'); },
      toString(){ called = 1; throw new Error('toString'); },
      [Symbol.toPrimitive](){ called = 1; throw new Error('Symbol.toPrimitive'); },
    };

    eq(O.int(val), 0);
    eq(called, 0);
  });

  test('Creates color from HSV', () => {
    var col1 = O.hsv(0);
    ok(col1 instanceof Uint8Array);
    eq(col1.length, 3);
    eq(col1[0], 255);
    eq(col1[1], 0);
    eq(col1[2], 0);

    var col2 = O.hsv(1 / 6, col1);
    eq(col2, col1);
    eq(col2.length, 3);
    eq(col2[0], 255);
    eq(col2[1], 255);
    eq(col2[2], 0);

    eq(O.hsv(2 / 6).join(','), '0,255,0');
    eq(O.hsv(3 / 6).join(','), '0,255,255');
    eq(O.hsv(4 / 6).join(','), '0,0,255');
    eq(O.hsv(5 / 6).join(','), '255,0,255');
    eq(O.hsv(6 / 6).join(','), '255,0,0');
  });
});