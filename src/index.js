'use strict';

class Window{
  constructor(){
    this.document = new Document();
  }
};

class Document{
  constructor(){}
};

const window = new Window();
const {document} = window;

'use strict';

class Vector{
  constructor(x=0, y=0){
    this.set(x, y);
  }

  static fromAngle(len, angle){
    var x = Math.cos(angle) * len;
    var y = Math.sin(angle) * len;

    return new O.Vector(x, y);
  }

  set(x, y){
    if(x instanceof O.Vector)
      ({x, y} = x);

    this.x = x;
    this.y = y;

    return this;
  }

  clone(){
    return new O.Vector(this.x, this.y);
  }

  add(x, y){
    if(x instanceof O.Vector)
      ({x, y} = x);

    this.x += x;
    this.y += y;

    return this;
  }

  sub(x, y){
    if(x instanceof O.Vector)
      ({x, y} = x);

    this.x -= x;
    this.y -= y;

    return this;
  }

  mul(val){
    this.x *= val;
    this.y *= val;

    return this;
  }

  div(val){
    this.x /= val;
    this.y /= val;

    return this;
  }

  combine(len, angle){
    this.x += Math.cos(angle) * len;
    this.y += Math.sin(angle) * len;

    return this;
  }

  dec(x, y){
    if(x instanceof O.Vector)
      ({x, y} = x);

    if(x !== 0){
      var sx = this.x > 0 ? 1 : -1;
      if(Math.abs(this.x) > x) this.x = x * sx - this.x;
      else this.x = 0;
    }

    if(y !== 0){
      var sy = this.y > 0 ? 1 : -1;
      if(Math.abs(this.y) > y) this.y = y * sy - this.y;
      else this.y = 0;
    }

    return this;
  }

  len(){
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  lenM(){
    return Math.abs(this.x) + Math.abs(this.y);
  }

  setLen(len){
    var angle = this.angle();

    this.x = Math.cos(angle) * len;
    this.y = Math.sin(angle) * len;

    return this;
  }

  angle(){
    return Math.atan2(this.y, this.x);
  }

  setAngle(angle){
    var len = this.len();

    this.x = Math.cos(angle) * len;
    this.y = Math.sin(angle) * len;

    return this;
  }

  norm(){
    this.div(this.len());

    return this;
  }

  dist(x, y){
    if(x instanceof O.Vector)
      ({x, y} = x);

    var dx = this.x - x;
    var dy = this.y - y;
    
    return Math.sqrt(dx * dx + dy * dy);;
  }

  maxLen(maxLen){
    if(this.len() > maxLen)
      this.setLen(maxLen);

    return this;
  }

  rotate(angle){
    var sin = Math.sin(angle);
    var cos = Math.cos(angle);
    var x = this.x * cos - this.y * sin;
    var y = this.x * sin + this.y * cos;

    this.x = x;
    this.y = y;

    return this;
  }

  isIn(x1, y1, x2, y2){
    var {x, y} = this;
    return x >= x1 && y >= y1 && x < x2 && y < y2;
  }
};

class Color extends Uint8ClampedArray{
  constructor(r, g, b){
    super(3);

    this.set(r, g, b);
  }

  static from(rgb){
    return new O.Color(rgb[0], rgb[1], rgb[2]);
  }

  static rand(hsv=0){
    let rgb;

    if(!hsv) rgb = O.ca(3, () => O.rand(256));
    else rgb = O.hsv(O.randf(1));

    return O.Color.from(rgb);
  }

  clone(){
    return O.Color.from(this);
  }

  from(col){
    this[0] = col[0];
    this[1] = col[1];
    this[2] = col[2];
    this.updateStr();
  }

  set(r, g, b){
    this[0] = r;
    this[1] = g;
    this[2] = b;
    this.updateStr();
  }

  setR(r){
    this[0] = r;
    this.updateStr();
  }

  setG(g){
    this[1] = g;
    this.updateStr();
  }

  setB(b){
    this[2] = b;
    this.updateStr();
  }

  updateStr(){
    this.str = `#${[...this].map(byte => {
      return byte.toString(16).padStart(2, '0');
    }).join('')}`;
  }

  toString(){
    return this.str;
  }
};

class Grid{
  constructor(w, h, func=null, d=null){
    this.w = w;
    this.h = h;

    if(d === null){
      d = O.ca(h, y => {
        return O.ca(w, x =>{
          if(func === null) return O.obj();
          return func(x, y);
        });
      });
    }

    this.d = d;
  }

  iter(func){
    const {w, h} = this;

    for(let y = 0; y !== h; y++)
      for(let x = 0; x !== w; x++)
        func(x, y, this.get(x, y));
  }

  iterate(func){
    this.iter(func);
  }

  some(func){
    const {w, h} = this;

    for(let y = 0; y !== h; y++)
      for(let x = 0; x !== w; x++)
        if(func(x, y, this.get(x, y)))
          return 1;

    return 0;
  }

  find(v, func){
    const {w, h} = this;

    for(let y = 0; y !== h; y++){
      for(let x = 0; x !== w; x++){
        if(func(x, y, this.get(x, y))){
          v.x = x;
          v.y = y;
          return 1;
        }
      }
    }

    return 0;
  }

  count(func){
    const {w, h} = this;
    let num = 0;

    for(let y = 0; y !== h; y++)
      for(let x = 0; x !== w; x++)
        if(func(x, y, this.get(x, y)))
          num++;

    return num;
  }

  iterAdj(x, y, wrap, func=null){
    if(func === null){
      func = wrap;
      wrap = 0;
    }

    const queue = [x, y];
    const queued = new O.Map2D(x, y);
    const visited = new O.Map2D();

    while(queue.length !== 0){
      const x = queue.shift();
      const y = queue.shift();

      queued.remove(x, y);
      visited.add(x, y);

      this.adj(x, y, wrap, (x1, y1, d, dir, wrapped) => {
        if(d === null) return;
        if(queued.has(x1, y1)) return;
        if(visited.has(x1, y1)) return;

        if(func(x1, y1, d, x, y, dir, wrapped)){
          queue.push(x1, y1);
          queued.add(x1, y1);
        }
      });
    }
  }

  adj(x, y, wrap, func=null){
    const {w, h} = this;

    if(func === null){
      func = wrap;
      wrap = 0;
    }

    let wd = 0;

    return (
      func(x, (wd = wrap && y === 0) ? h - 1 : y - 1, this.get(x, y - 1, wrap), 0, wd) ||
      func((wd = wrap && x === w - 1) ? 0 : x + 1, y, this.get(x + 1, y, wrap), 1, wd) ||
      func(x, (wd = wrap && y === h - 1) ? 0 : y + 1, this.get(x, y + 1, wrap), 2, wd) ||
      func((wd = wrap && x === 0) ? w - 1 : x - 1, y, this.get(x - 1, y, wrap), 3, wd)
    );
  }

  adjc(x, y, wrap, func=null){
    const {w, h} = this;

    if(func === null){
      func = wrap;
      wrap = 0;
    }

    return (
      func(wrap && x === 0 ? w - 1 : x - 1, wrap && y === 0 ? h - 1 : y - 1, this.get(x - 1, y - 1, wrap), 0) ||
      func(wrap && x === w - 1 ? 0 : x + 1, wrap && y === 0 ? h - 1 : y - 1, this.get(x + 1, y - 1, wrap), 1) ||
      func(wrap && x === 0 ? w - 1 : x - 1, wrap && y === h - 1 ? 0 : y + 1, this.get(x - 1, y + 1, wrap), 2) ||
      func(wrap && x === w - 1 ? 0 : x + 1, wrap && y === h - 1 ? 0 : y + 1, this.get(x + 1, y + 1, wrap), 3)
    );
  }

  findAdj(x, y, wrap, func=null){
    const {w, h} = this;

    if(func === null){
      func = wrap;
      wrap = 0;
    }

    let dir = 0;
    let wd;

    const found = (
      func(x, (wd = wrap && y === 0) ? h - 1 : y - 1, this.get(x, y - 1, wrap), dir++, wd) ||
      func((wd = wrap && x === w - 1) ? 0 : x + 1, y, this.get(x + 1, y, wrap), dir++, wd) ||
      func(x, (wd = wrap && y === h - 1) ? 0 : y + 1, this.get(x, y + 1, wrap), dir++, wd) ||
      func((wd = wrap && x === 0) ? w - 1 : x - 1, y, this.get(x - 1, y, wrap), dir++, wd)
    );

    if(!found) return -1;
    return dir - 1;
  }

  nav(v, dir, wrap=0){
    const {w, h} = this;

    switch(dir){
      case 0: v.y--; break;
      case 1: v.x++; break;
      case 2: v.y++; break;
      case 3: v.x--; break;
    }

    if(wrap){
      if(v.x === -1) v.x = w - 1;
      if(v.y === -1) v.y = h - 1;
      if(v.x === w) v.x = 0;
      if(v.y === h) v.y = 0;
    }

    return this.get(v.x, v.y, wrap);
  }

  path(xs, ys, wrap=null, all=null, func=null){
    if(func === null){
      if(all === null){
        func = wrap;
        wrap = 0;
      }else{
        func = all;
      }
      all = 0;
    }

    const queue = [[xs, ys, [], new O.Map2D(xs, ys, 0), '']];
    const queued = O.obj();
    const visited = O.obj();

    let path = null;

    queued[''] = new O.Map2D(xs, ys);

    while(queue.length !== 0){
      const [x, y, pp, cp, sp] = queue.shift();
      const dirp = pp.length !== 0 ? O.last(pp) ^ 2 : -1;

      queued[sp].remove(x, y);

      if(!(sp in visited))
        visited[sp] = new O.Map2D(x, y);
      else
        visited[sp].add(x, y);

      if(this.adj(x, y, wrap, (x1, y1, d, dir, wrapped) => {
        if(dir === dirp) return;

        const start = x1 === xs && y1 === ys;

        if(!start){
          const len = cp.get(x1, y1);
          if(len !== null && ((len ^ pp.length) & 1)) return;
        }

        const p = pp.slice();
        const c = cp.clone();
        const s = all ? sp + dir : wrap && (pp.length & 1) ? '1' : '';

        p.push(dir);
        c.add(x1, y1, p.length);

        if(!start){
          if((s in queued) && queued[s].has(x1, y1)) return;
          if((s in visited) && visited[s].has(x1, y1)) return;
        }

        switch(func(x1, y1, d, x, y, dir, wrapped, p, c, cp)){
          case 1:
            if(start) break;
            queue.push([x1, y1, p, c, s]);
            if(!(s in queued))
              queued[s] = new O.Map2D(x1, y1);
            else
              queued[s].add(x1, y1);
            break;

          case 2:
            path = p;
            return 1;
            break;
        }
      })) break;
    }

    return path;
  }

  findPath(x, y, wrap, all, func){
    this.path(x, y, wrap, all, func);
  }

  get(x, y, wrap=0){
    const {w, h} = this;

    if(!this.includes(x, y)){
      if(!wrap) return null;
      x = ((x % w) + w) % w;
      y = ((y % h) + h) % h;
    }

    return this.d[y][x];
  }

  set(x, y, val, wrap=0){
    const {w, h} = this;

    if(!this.includes(x, y)){
      if(!wrap) return null;
      x = ((x % w) + w) % w;
      y = ((y % h) + h) % h;
    }

    this.d[y][x] = val;
  }

  has(x, y){
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  includes(x, y){
    return this.has(x, y);
  }
};

class GridUI{
  constructor(w, h, s, func=() => O.obj()){
    this.func = func;
    this.grid = new O.Grid(w, h, func);
    this.scale = s;

    const {g, w: iw, h: ih} = O.ceCanvas(1);
    const [iwh, ihh] = [iw, ih].map(a => a / 2);

    g.concaveMode = 1;

    this.g = g;
    this.iw = iw;
    this.ih = ih;
    this.iwh = iwh;
    this.ihh = ihh;

    this.transform();

    this.keys = O.obj();
    this.mbs = 0;
    this.cur = new O.Vector;

    this.funcs = {
      draw: [],
      frame: [],
    };

    this.wrap = 0;

    this.ls = O.obj();
    this.aels();
  }

  aels(){
    const btnName = btn => 'lmr'[btn];
    const {keys, cur} = this;

    O.ael('keydown', evt => {
      const key = evt.code;

      keys[key] = 1;
      this.emit(`k${key}`, cur.x, cur.y);
    });

    O.ael('keyup', evt => {
      const key = evt.code;

      keys[key] = 0;
      this.emit(`ku${key}`, cur.x, cur.y);
    });

    O.ael('mousedown', evt => {
      const btn = evt.button;

      this.mbs |= 1 << btn;
      this.updateCur(evt);

      this.emit(`${btnName(btn)}mb`, cur.x, cur.y);
    });

    O.ael('mousemove', evt => {
      const {mbs} = this;
      const {x, y} = cur;

      this.updateCur(evt);

      if(cur.x !== x || cur.y !== y){
        const dx = Math.sign(cur.x - x);
        const dy = Math.sign(cur.y - y);

        let xx = x, yy = y;
        let dir = dx === 1 ? 1 : 3;
        let prev;

        while(xx !== cur.x){
          prev = xx;
          xx += dx;

          this.emit('move', xx, yy);
          for(let btn = 0; btn !== 3; btn++)
            if(mbs & (1 << btn))
              this.emit(`drag${btnName(btn)}`, prev, yy, xx, yy, dir);
        }

        dir = dy === 1 ? 2 : 0;

        while(yy !== cur.y){
          prev = yy;
          yy += dy;

          this.emit('move', xx, yy);
          for(let btn = 0; btn !== 3; btn++)
            if(mbs & (1 << btn))
              this.emit(`drag${btnName(btn)}`, xx, prev, xx, yy, dir);
        }
      }
    });

    O.ael('mouseup', evt => {
      const btn = evt.button;

      this.mbs &= ~(1 << btn);
      this.updateCur(evt);

      this.emit(`${btnName(btn)}mbu`, cur.x, cur.y);
    });

    O.ael('blur', evt => {
      this.mbs = 0;
    });

    O.ael('contextmenu', evt => {
      evt.preventDefault();
      evt.stopPropagation();
    });
  }

  updateCur(evt){
    const {clientX: x, clientY: y} = evt;
    const {scale, g, cur} = this;

    cur.x = Math.floor((x - g.tx) / scale);
    cur.y = Math.floor((y - g.ty) / scale);
  }

  transform(){
    const {grid, g} = this;

    g.resetTransform();
    g.translate(this.iwh, this.ihh);
    g.scale(this.scale);
    g.translate(-grid.w / 2, -grid.h / 2);
  }

  tick(){
    this.emit('tick');
  }

  draw(){
    const {grid, g, funcs, wrap} = this;

    g.clearCanvas('darkgray');

    for(const drawf of funcs.draw){
      g.save();
      grid.iter((x, y, d) => {
        g.translate(x, y);
        drawf(g, d, x, y);
        g.restore();
      });
    }

    for(const framef of funcs.frame){
      g.beginPath();

      grid.iter((x, y, d1) => {
        grid.adj(x, y, wrap, (xx, yy, d2, dir) => {
          if(dir === 3 && x !== 0) return;
          if(dir === 0 && y !== 0) return;
          if(!framef(g, d1, d2, x, y, dir)) return;

          switch(dir){
            case 0:
              g.moveTo(x, y);
              g.lineTo(x + 1, y);
              break;

            case 1:
              g.moveTo(x + 1, y);
              g.lineTo(x + 1, y + 1);
              break;

            case 2:
              g.moveTo(x, y + 1);
              g.lineTo(x + 1, y + 1);
              break;

            case 3:
              g.moveTo(x, y);
              g.lineTo(x, y + 1);
              break;
          }
        });
      });

      g.stroke();
    }
  }

  render(){
    this.tick();
    this.draw();

    O.raf(this.render.bind(this));
  }

  removeListener(type, func){
    const {ls} = this;
    if(!(type in ls)) return;
    ls[type].remove(func);
  }

  removeAllListeners(type){
    delete this.ls[type];
  }

  on(type, func){
    if(type === 'draw'){
      this.funcs.draw.push(func);
      return;
    }

    if(type === 'frame'){
      this.funcs.frame.push(func);
      return;
    }

    const {ls} = this;
    if(!(type in ls)) ls[type] = new Set();
    ls[type].add(func);
    return this;
  }

  emit(type, ...args){
    const {ls} = this;
    if(!(type in ls)) return;
    for(const func of ls[type])
      func(...args);
  }
};

class Map2D{
  constructor(x=null, y=null, val=1){
    this.d = O.obj();

    if(x !== null)
      this.add(x, y, val);
  }

  reset(x=null, y=null, val=1){
    this.d = O.obj();

    if(x !== null)
      this.add(x, y, val);
  }

  empty(){
    this.reset();
  }

  clone(){
    const map = new O.Map2D();
    this.iter((x, y, d) => map.add(x, y, d));
    return map;
  }

  eq(map){
    if(this.some((x, y) => !map.has(x, y))) return 0;
    if(map.some((x, y) => !this.has(x, y))) return 0;
    return 1;
  }

  neq(map){
    return !this.eq(map);
  }

  get(x, y, defaultVal=null){
    if(!this.has(x, y)) return defaultVal;
    return this.d[y][x];
  }

  set(x, y, val=1){
    var {d} = this;

    if(!(y in d)) d[y] = O.obj();
    d[y][x] = val;

    return this;
  }

  add(x, y, val=1){
    return this.set(x, y, val);
  }

  remove(x, y){
    var {d} = this;

    if(!(y in d)) return;
    delete d[y][x];
  }

  delete(x, y){
    this.remove(x, y);
  }

  del(x, y){
    this.remove(x, y);
  }

  has(x, y){
    var {d} = this;

    if(!(y in d)) return 0;
    if(!(x in d[y])) return 0;
    return 1;
  }

  iter(func){
    const {d} = this;

    for(let y in d)
      for(let x in d[y |= 0])
        func(x |= 0, y, d[y][x]);
  }

  iterate(func){
    this.iter(func);
  }

  some(func){
    const {d} = this;

    for(let y in d)
      for(let x in d[y |= 0])
        if(func(x |= 0, y, d[y][x]))
          return;
  }

  find(v, func){
    const {d} = this;

    for(let y in d){
      for(let x in d[y |= 0]){
        const val = d[y][x |= 0];

        if(func(x, y, val)){
          v.x = x;
          v.y = y;

          return val;
        }
      }
    }

    return null;
  }

  getArr(){
    const arr = [];
    this.iter((x, y) => arr.push([x, y]));
    return arr;
  }

  *[Symbol.iterator](){
    const {d} = this;

    for(let y in d)
      for(let x in d[y |= 0])
        yield [x |= 0, y, d[y][x]];
  }
};

class Map3D{
  constructor(x=null, y=null, z = null, val=1){
    this.d = O.obj();

    if(x !== null)
      this.add(x, y, z, val);
  }

  get(x, y, z){
    if(!this.has(x, y, z)) return null;
    return this.d[z][y][x];
  }

  set(x, y, z, val=1){
    var {d} = this;

    if(!(z in d)) d[z] = O.obj();
    d = d[z];

    if(!(y in d)) d[y] = O.obj();
    d[y][x] = val;
  }

  add(x, y, z, val=1){
    this.set(x, y, z, val);
  }

  remove(x, y, z){
    var {d} = this;

    if(!(z in d)) return;
    d = d[z];

    if(!(y in d)) return;
    delete d[y][x];
  }

  has(x, y, z){
    var {d} = this;

    if(!(z in d)) return 0;
    d = d[z];

    
    if(!(y in d)) return 0;
    return d[y][x];
  }

  getArr(){
    var {d} = this;

    var arr = [];

    O.keys(d).forEach(z => {
      z |= 0;
      O.keys(d = d[z]).forEach(y => {
        y |= 0;
        O.keys(d[y]).forEach(x => {
          x |= 0;
          arr.push([x, y, z]);
        });
      });
    });

    return arr;
  }
};

class CoordsColle{
  constructor(x=null, y=null){
    this.map = new O.Map2D();
    this.arr = [];

    if(x !== null)
      this.add(x, y);
  }

  reset(x=null, y=null){
    this.map.reset();
    this.arr.length = 0;

    if(x !== null)
      this.add(x, y);
  }

  empty(){
    this.reset();
  }

  len(){
    return this.arr.length >> 1;
  }

  isEmpty(){
    return this.len() === 0;
  }

  eq(cc){
    if(this.len() !== cc.len()) return 0;
    return !this.some((x, y) => !cc.has(x, y));
  }

  neq(cc){
    return !this.eq(cc);
  }

  has(x, y){
    return this.map.has(x, y);
  }

  add(x, y, top=1){
    const {map, arr} = this;

    if(!map.has(x, y)){
      map.add(x, y, arr.length);
      arr.push(x, y);
      return;
    }

    if(!top) return;

    const i = map.get(x, y);
    const j = arr.length - 2;
    if(i === j) return;

    const x1 = arr[j];
    const y1 = arr[j + 1];

    map.set(x, y, j);
    map.set(x1, y1, i);
    arr[j] = x, arr[j + 1] = y;
    arr[i] = x1, arr[i + 1] = y1;
  }

  push(x, y){
    this.add(x, y);
  }

  remove(x, y){
    const {map, arr} = this;
    if(!map.has(x, y)) return;

    const i = map.get(x, y);
    this.removeByIndex(i);
  }

  delete(x, y){
    this.remove(x, y);
  }

  del(x, y){
    this.remove(x, y);
  }

  removeByIndex(i){
    const {map, arr} = this;
    const j = arr.length - 2;

    const x = arr[i];
    const y = arr[i + 1];
    map.remove(x, y);

    if(i !== j){
      const x1 = arr[j];
      const y1 = arr[j + 1];

      map.set(x1, y1, i);
      arr[i] = x1, arr[i + 1] = y1;
    }

    arr.length = j;
  }

  pop(v){
    return this.getByIndex(v, this.arr.length - 2, 1);
  }

  rand(v, remove=0){
    return this.getByIndex(v, O.rand(this.arr.length) & ~1, remove);
  }

  getByIndex(v, i, remove=0){
    const {arr} = this;
    if((i & 1) || i < 0 || i >= arr.length) return null;

    v.x = arr[i];
    v.y = arr[i + 1];

    if(remove)
      this.removeByIndex(i);

    return v;
  }

  iter(func){ return this.map.iter(func); }
  some(func){ return this.map.some(func); }
  find(v, func){ return this.map.find(v, func); }
  [Symbol.iterator](){ return this.map[Symbol.iterator](); }
};

class EnhancedRenderingContext{
  constructor(g){
    this.g = g;
    this.canvas = g.canvas;

    this.w = this.canvas.width;
    this.h = this.canvas.height;

    this.s = 1;
    this.tx = 0;
    this.ty = 0;

    this.rtx = 0;
    this.rty = 0;
    this.rot = 0;
    this.rcos = 0;
    this.rsin = 0;

    this.fontSize = 32;
    this.fontScale = 1;
    this.fontFamily = 'Arial';
    this.fontModifiers = '';

    this.pointsQueue = [];
    this.arcsQueue = [];

    this.concaveMode = false;

    [
      'fillStyle',
      'strokeStyle',
      'globalAlpha',
      'textAlign',
      'textBaseline',
      'lineWidth',
      'globalCompositeOperation',
      'lineCap',
      'lineJoin',
    ].forEach(prop => {
      Object.defineProperty(this, prop, {
        set: val => g[prop] = val,
        get: () => g[prop],
      });
    });

    [
      'clearRect',
      'measureText',
    ].forEach(prop => this[prop] = g[prop].bind(g));

    this.fillStyle = 'white';
    this.strokeStyle = 'black';
    this.textAlign = 'center';
    this.textBaseline = 'middle';

    this.drawImage = g.drawImage.bind(g);

    this.clearCanvas();
  }

  clearCanvas(col=null){
    var {canvas, g} = this;
    if(col !== null) g.fillStyle = col;
    g.fillRect(0, 0, canvas.width, canvas.height);
  }

  createLinearGradient(...params){
    return this.g.createLinearGradient(...params);
  }

  beginPath(){
    this.pointsQueue.length = 0;
    this.arcsQueue.length = 0;
  }

  closePath(){
    var q = this.pointsQueue;
    q.push(1, q[1], q[2]);
  }

  fill(){
    this.finishLine(true);
    this.g.fill();
  }

  stroke(){
    this.finishLine(false);
    this.g.stroke();
  }

  finishLine(fillMode){
    var {g} = this;
    var q = this.pointsQueue;
    var aq = this.arcsQueue;

    var x1 = q[1];
    var y1 = q[2];

    var i = 0;
    var j = 0;

    var concaveMode = this.concaveMode && !fillMode;
    var hasArcs = aq.length !== 0;

    if(concaveMode){
      var fillStyle = g.fillStyle;
      g.fillStyle = g.strokeStyle;
    }

    g.beginPath();

    do{
      if(j < aq.length && aq[j] === i){
        g.arc(aq[j + 1], aq[j + 2], aq[j + 3], aq[j + 4], aq[j + 5], aq[j + 6]);
        j += 7;
      }

      var type = q[i];

      var x2 = q[i + 1];
      var y2 = q[i + 2];

      if(fillMode){
        if(Math.abs(x1 - x2) === 1) x2 = x1;
        if(Math.abs(y1 - y2) === 1) y2 = y1;
      }

      if(!type){
        x1 = x2;
        y1 = y2;
        continue;
      }

      if(fillMode){
        g.lineTo(x2, y2);
      }else{
        var dx = y1 !== y2 ? .5 : 0;
        var dy = x1 !== x2 ? .5 : 0;

        g.moveTo(x1 + dx, y1 + dy);
        g.lineTo(x2 + dx, y2 + dy);

        if(concaveMode){
          if(x1 < x2 || y1 < y2)
            g.fillRect(x2, y2, 1, 1);
        }
      }

      x1 = x2;
      y1 = y2;
    }while((i += 3) < q.length);

    if(concaveMode)
      g.fillStyle = fillStyle;
  }

  resetTransform(resetScale=1){
    if(resetScale)
      this.s = 1;
    
    this.tx = 0;
    this.ty = 0;
    this.rot = 0;

    this.g.resetTransform();
  }

  scale(s){
    this.s *= s;
  }

  translate(x, y){
    this.tx += this.s * x;
    this.ty += this.s * y;
  }

  rotate(x, y, angle){
    this.rot = angle;

    if(angle){
      this.rtx = x;
      this.rty = y;
      this.rcos = Math.cos(angle);
      this.rsin = -Math.sin(angle);
    }
  }

  save(rot=0){
    this.sPrev = this.s;
    this.txPrev = this.tx;
    this.tyPrev = this.ty;

    if(rot){
      this.rtxPrev = this.rtx;
      this.rtyPrev = this.rty;
      this.rotPrev = this.rot;
      this.rcosPrev = this.rcos;
      this.rsinPrev = this.rsin;
    }
  }

  restore(rot=0){
    this.s = this.sPrev;
    this.tx = this.txPrev;
    this.ty = this.tyPrev;

    if(rot){
      this.rtx = this.rtxPrev;
      this.rty = this.rtyPrev;
      this.rot = this.rotPrev;
      this.rcos = this.rcosPrev;
      this.rsin = this.rsinPrev;
    }
  }

  rect(x, y, w, h){
    var s1 = 1 / this.s;

    this.moveTo(x, y);
    this.lineTo(x + w + s1, y);

    this.moveTo(x + w, y);
    this.lineTo(x + w, y + h + s1);

    this.moveTo(x + w + s1, y + h);
    this.lineTo(x, y + h);

    this.moveTo(x, y + h + s1);
    this.lineTo(x, y);
  }

  fillRect(x, y, w, h){
    if(this.rot){
      this.g.beginPath();
      this.rect(x, y, w, h);
      this.fill();
      return;
    }

    this.g.fillRect(Math.round(x * this.s + this.tx), Math.round(y * this.s + this.ty), Math.round(w * this.s) + 1, Math.round(h * this.s) + 1);
  }

  moveTo(x, y){
    if(this.rot){
      var xx = x - this.rtx;
      var yy = y - this.rty;

      x = this.rtx + xx * this.rcos - yy * this.rsin;
      y = this.rty + yy * this.rcos + xx * this.rsin;
    }

    this.pointsQueue.push(0, Math.round(x * this.s + this.tx), Math.round(y * this.s + this.ty));
  }

  lineTo(x, y){
    if(this.rot){
      var xx = x - this.rtx;
      var yy = y - this.rty;

      x = this.rtx + xx * this.rcos - yy * this.rsin;
      y = this.rty + yy * this.rcos + xx * this.rsin;
    }

    this.pointsQueue.push(1, Math.round(x * this.s + this.tx), Math.round(y * this.s + this.ty));
  }

  arc(x, y, r, a1, a2, acw){
    if(this.rot){
      var xx = x - this.rtx;
      var yy = y - this.rty;

      x = this.rtx + xx * this.rcos - yy * this.rsin;
      y = this.rty + yy * this.rcos + xx * this.rsin;

      a1 = (a1 - this.rot) % O.pi2;
      a2 = (a2 - this.rot) % O.pi2;
    }

    var xx = x * this.s + this.tx + .5;
    var yy = y * this.s + this.ty + .5;
    var rr = r * this.s;
    this.arcsQueue.push(this.pointsQueue.length, xx, yy, rr, a1, a2, acw);

    xx += Math.cos(a2) * rr;
    yy += Math.sin(a2) * rr;
    this.pointsQueue.push(0, xx, yy);
  }

  fillText(text, x, y){
    if(this.rot){
      var xx = x - this.rtx;
      var yy = y - this.rty;

      x = this.rtx + xx * this.rcos - yy * this.rsin;
      y = this.rty + yy * this.rcos + xx * this.rsin;
    }

    this.g.fillText(text, Math.round(x * this.s + this.tx) + 1, Math.round(y * this.s + this.ty) + 1);
  }

  strokeText(text, x, y){
    if(this.rot){
      var xx = x - this.rtx;
      var yy = y - this.rty;

      x = this.rtx + xx * this.rcos - yy * this.rsin;
      y = this.rty + yy * this.rcos + xx * this.rsin;
    }

    this.g.strokeText(text, Math.round(x * this.s + this.tx) + 1, Math.round(y * this.s + this.ty) + 1);
  }

  updateFont(){
    var modifiers = this.fontModifiers;
    var strDelimiter = modifiers.length !== 0 ? ' ' : '';

    this.g.font = `${modifiers}${strDelimiter}${this.fontSize * this.fontScale}px "${this.fontFamily}"`;
  }

  font(size){
    this.fontSize = size;
    this.updateFont();
  }

  scaleFont(scale){
    this.fontScale = scale;
    this.updateFont();
  }

  setFontModifiers(modifiers){
    this.fontModifiers = modifiers;
    this.updateFont();
  }

  removeFontModifiers(){
    this.fontModifiers = '';
    this.updateFont();
  }

  drawTube(x, y, dirs, size, round=0){
    const g = this;

    const s1 = (1 - size) / 2;
    const s2 = 1 - s1;

    const radius = Math.min(size, .5);

    const p1 = (1 - Math.sqrt(radius * radius * 4 - size * size)) / 2;
    const p2 = 1 - p1;

    const phi1 = (1.9 - size / (radius * 4)) * O.pi;
    const phi2 = phi1 + O.pi2 - size / radius * O.pih;

    let dphi = 0;
    let foundArc = round;

    g.beginPath();

    drawingBlock: {
      if(round === 1){
        switch(dirs){
          case 0:
            g.arc(x + .5, y + .5, radius, 0, O.pi2);
            break;

          case 1:
            g.moveTo(x + s2, y + p1);
            g.lineTo(x + s2, y);
            g.lineTo(x + s1, y);
            g.lineTo(x + s1, y + p1);
            break;

          case 2:
            dphi = O.pi2 - (O.pi + O.pih);
            g.moveTo(x + p2, y + s2);
            g.lineTo(x + 1, y + s2);
            g.lineTo(x + 1, y + s1);
            g.lineTo(x + p2, y + s1);
            break;

          case 4:
            dphi = O.pi;
            g.moveTo(x + s1, y + p2);
            g.lineTo(x + s1, y + 1);
            g.lineTo(x + s2, y + 1);
            g.lineTo(x + s2, y + p2);
            break;

          case 8:
            dphi = O.pi2 - O.pih;
            g.moveTo(x + p1, y + s1);
            g.lineTo(x, y + s1);
            g.lineTo(x, y + s2);
            g.lineTo(x + p1, y + s2);
            break;

          default:
            foundArc = 0;
            break;
        }

        if(foundArc)
          break drawingBlock;
      }

      g.moveTo(x + s1, y + s1);

      if(dirs & 1){
        g.lineTo(x + s1, y);
        g.lineTo(x + s2, y);
      }
      g.lineTo(x + s2, y + s1);

      if(dirs & 2){
        g.lineTo(x + 1, y + s1);
        g.lineTo(x + 1, y + s2);
      }
      g.lineTo(x + s2, y + s2);

      if(dirs & 4){
        g.lineTo(x + s2, y + 1);
        g.lineTo(x + s1, y + 1);
      }
      g.lineTo(x + s1, y + s2);

      if(dirs & 8){
        g.lineTo(x, y + s2);
        g.lineTo(x, y + s1);
      }
    }

    if(foundArc){
      if(dirs !== 0)
        g.arc(x + .5, y + .5, radius, phi2 + dphi, phi1 + dphi, 1);

      g.fill();
      g.stroke();
    }else{
      g.closePath();
      g.fill();
      g.stroke();

      const col = g.strokeStyle;
      const s = 1 / g.s;

      g.strokeStyle = g.fillStyle;
      g.beginPath();

      if(dirs & 1){
        g.moveTo(x + s1 + s, y);
        g.lineTo(x + s2 - s, y);
      }

      if(dirs & 2){
        g.moveTo(x + 1, y + s1 + s);
        g.lineTo(x + 1, y + s2 - s);
      }

      if(dirs & 4){
        g.moveTo(x + s2 - s, y + 1);
        g.lineTo(x + s1 + s, y + 1);
      }

      if(dirs & 8){
        g.moveTo(x, y + s2);
        g.lineTo(x, y + s1 + s);
      }

      g.stroke();
      g.strokeStyle = col;
    }
  }
};

class Buffer extends Uint8Array{
  constructor(...params){
    if(params.length === 1 && typeof params[0] === 'string')
      params[0] = [...params[0]].map(a => O.cc(a));

    super(...params);
  }

  static alloc(size){
    return new O.Buffer(size);
  }

  static from(data, encoding){
    if(data.length === 0)
      return O.Buffer.alloc(0);

    switch(encoding){
      case 'hex':
        data = data.match(/[0-9a-f]{2}/gi).map(a => parseInt(a, 16));
        return new O.Buffer(data);
        break;

      default:
        return new O.Buffer(data);
        break;
    }
  }

  static concat(arr){
    arr = arr.reduce((concatenated, buff) => {
      return [...concatenated, ...buff];
    }, []);

    return new O.Buffer(arr);
  }

  equals(buf){
    const len = this.length;
    if(buf.length !== len) return false;

    for(let i = 0; i !== len; i++)
      if(buf[i] !== this[i]) return false;

    return true;
  }

  readUInt32BE(offset){
    var val;

    val = this[offset] * 2 ** 24;
    val += this[offset + 1] * 2 ** 16;
    val += this[offset + 2] * 2 ** 8;
    val += this[offset + 3];

    return val;
  }

  writeUInt32BE(val, offset){
    this[offset] = val / 2 ** 24;
    this[offset + 1] = val / 2 ** 16;
    this[offset + 2] = val / 2 ** 8;
    this[offset + 3] = val;
  }

  writeInt32BE(val, offset){
    this[offset] = val >> 24;
    this[offset + 1] = val >> 16;
    this[offset + 2] = val >> 8;
    this[offset + 3] = val;
  }

  toString(encoding){
    var arr = [...this];

    switch(encoding){
      case 'hex':
        return arr.map(a => a.toString(16).padStart(2, '0')).join('');
        break;

      default:
        return arr.map(a => String.fromCharCode(a)).join('');
        break;
    }
  }
};

class Storage{
  constructor(obj=null, path=null, prefix=null){
    if(obj === null) obj = O.obj();

    this.obj = obj;
    this.prefix = prefix;

    if(path !== null){
      var obj1 = this.get(path);

      if(!this.isObj(obj1)){
        obj1 = O.obj();
        this.set(path, obj1);
      }

      this.obj = obj1;
    }
  }

  reset(){
    const {obj} = this;

    for(var key of O.keys(obj))
      if(this.isOwnKey(key))
        delete obj[key];
  }

  has(path){
    var {obj} = this;

    return this.iterPath(path, key => {
      if(!(key in obj)) return;
      obj = obj[key];
      return 1;
    });
  }

  get(path, defaultVal=null){
    var {obj} = this;

    var found = this.iterPath(path, key => {
      if(!(key in obj)) return;
      obj = obj[key];
      return 1;
    });

    if(!found) return defaultVal;
    return obj;
  }

  set(path, val){
    var {obj} = this;
    var last;

    this.iterPath(path, (key, index, arr) => {
      if(index === arr.length - 1){
        last = key;
        return 1;
      }

      if(!this.isObj(obj[key])) obj[key] = O.obj();
      obj = obj[key];
      return 1;
    });

    obj[last] = val;
  }

  remove(path){
    var {obj} = this;
    var last;

    var found = this.iterPath(path, (key, index, arr) => {
      if(index === arr.length - 1){
        last = key;
        return 1;
      }

      if(!(key in obj)) return;
      obj = obj[key];
      return 1;
    });

    if(!found) return;
    delete obj[last];
  }

  iterPath(path, func){
    return path.split('.').every((key, index, arr) => {
      if(index === 0) key = this.format(key);
      return func(key, index, arr);
    });
  }

  format(key){
    const {prefix} = this;

    if(prefix === null) return key;
    return `${prefix}_${key}`;
  }

  isOwnKey(key){
    const {prefix} = this;

    if(prefix === null) return 1;
    return key.startsWith(`${prefix}_`);
  }

  isObj(val){
    return typeof val === 'object' && val !== null;
  }
};

class IO{
  constructor(input='', checksum=0, pad=0){
    let buf = O.Buffer.from(input);
    if(checksum) buf = IO.unlock(buf, 1);

    this.input = buf
    this.output = O.Buffer.alloc(1);

    this.pad = pad;

    this.inputIndex = pad ? 0 : 1;
    this.outputIndex = 0;
    this.byte = 0;
  }

  static name(){ return 'Standard'; }
  static isBit(){ return 0; }

  static lock(buf, sameBuf=0){
    if(!sameBuf) buf = O.Buffer.from(buf);

    const cs = O.sha256(buf);
    IO.xor(buf, cs, 1);
    buf = O.Buffer.concat([buf, cs]);

    return buf;
  }

  static unlock(buf, sameBuf=0){
    if(!sameBuf) buf = O.Buffer.from(buf);
    const err = () => { throw new TypeError('Invalid checksum'); };

    const len = buf.length;
    if(len < 32) err();

    const cs = O.Buffer.from(buf.slice(len - 32));

    buf = O.Buffer.from(buf.slice(0, len - 32));
    IO.xor(buf, cs, 1);

    if(!O.sha256(buf).equals(cs)) err();

    return buf;
  }

  static xor(buf, hash, sameBuf=0){
    if(!sameBuf) buf = O.Buffer.from(buf);
    const len = buf.length;

    for(let i = 0, j = 0; i !== len; i++, j++){
      buf[i] ^= hash[j];

      if(j === 32){
        hash = O.sha256(hash);
        j = 0;
      }
    }

    return buf;
  }

  hasMore(){
    return (this.inputIndex >> 4) < this.input.length;
  }

  read(){
    const {input} = this;
    const i = this.inputIndex;

    if((i >> 4) >= input.length) return 0;
    this.inputIndex += this.pad ? 1 : 2;

    if((i & 1) === 0) return 1;
    return input[i >> 4] & (1 << ((i >> 1) & 7)) ? 1 : 0;
  }

  write(bit){
    this.byte |= bit << (this.outputIndex++ & 7);
    if((this.outputIndex & 7) === 0) this.addByte();
  }

  addByte(){
    const len = this.outputIndex - 1 >> 3;

    if(len === this.output.length){
      const buf = O.Buffer.alloc(len);
      this.output = O.Buffer.concat([this.output, buf]);
    }

    this.output[len] = this.byte;
    this.byte = 0;
  }

  getOutput(checksum=0, encoding=null){
    if((this.outputIndex & 7) !== 0) this.addByte();

    const len = Math.ceil(this.outputIndex / 8);
    let buf = O.Buffer.from(this.output.slice(0, len));
    if(checksum) buf = IO.lock(buf, 1);

    if(encoding !== null) buf = buf.toString(encoding);
    return buf;
  }
};

class Serializer extends IO{
  constructor(buf, checksum=0){
    super(buf, checksum);
  }

  write(num, max=1){
    num |= 0;
    max |= 0;
    if(max === 0) return;

    let mask = 1 << 31 - Math.clz32(max);
    let limit = 1;

    while(mask !== 0){
      if(!limit || (max & mask)){
        let bit = num & mask ? 1 : 0;
        super.write(bit);
        if(!bit) limit = 0;
      }
      mask >>= 1;
    }

    return num;
  }

  read(max=1){
    max |= 0;
    if(max === 0) return 0;

    let mask = 1 << 31 - Math.clz32(max);
    let limit = 1;
    let num = 0;

    while(mask !== 0){
      num <<= 1;
      if(!limit || (max & mask)){
        let bit = super.read();
        num |= bit;
        if(!bit) limit = 0;
      }
      mask >>= 1;
    }

    return num;
  }

  writeInt(num){
    num = (num | 0) + 1;

    while(num !== 1){
      super.write(1);
      super.write(num & 1);
      num >>= 1;
    }

    super.write(0);
  }

  readInt(){
    let num = 0;
    let mask = 1;

    while(super.read()){
      if(super.read())
        num |= mask;
      mask <<= 1;
    }

    return (num | mask) - 1;
  }

  writeStr(str){
    this.writeInt(str.length);

    for(const char of str)
      this.write(O.cc(char), 255);
  }

  readStr(){
    const len = this.readInt();
    let str = '';

    for(let i = 0; i !== len; i++)
      str += O.sfcc(this.read(255));

    return str;
  }

  writeBuf(buf){
    this.writeInt(buf.length);

    for(const byte of buf)
      this.write(buf, 255);
  }

  readBuf(){
    const len = this.readInt();
    const buf = O.Buffer.alloc(len);

    for(let i = 0; i !== len; i++)
      buf[i] = this.read(255);

    return buf;
  }

  getOutput(checksum=0, encoding=null, trim=1){
    let buf = super.getOutput(checksum);
    let len = buf.length;

    if(trim && len !== 0 && buf[len - 1] === 0){
      let i = len - 1;
      for(; i !== -1; i--)
        if(buf[i] !== 0) break;
      buf = O.Buffer.from(buf.slice(0, i + 1));
    }

    if(encoding !== null) buf = buf.toString(encoding);
    return buf;
  }
};

const O = {
  global: null,
  isNode: null,
  isBrowser: null,
  isElectron: null,
  crypto: null,

  doc: document,
  head: document.head,
  body: document.body,

  pi: Math.PI,
  pi2: Math.PI * 2,
  pih: Math.PI / 2,
  pi32: Math.PI * 3 / 2,

  static: Symbol('static'),
  project: null,
  storage: null,
  enhancedRNG: 0,
  fastSha256: 1,
  rseed: null,

  module: {
    cache: null,
    remaining: 0,
  },

  // Classes

  Vector,
  Color,
  Grid,
  GridUI,
  Map2D,
  Map3D,
  CoordsColle,
  EnhancedRenderingContext,
  Buffer,
  Storage,
  IO,
  Serializer,

  init(loadProject=1){
    O.storage = O.obj();

    var global = O.global = new Function('return this;')();
    var env = 'navigator' in global ? 'browser' : 'node';

    O.env = env;

    var isBrowser = O.isBrowser = env === 'browser';
    var isNode = O.isNode = env === 'node';
    var isElectron = O.isElectron = isBrowser && navigator.userAgent.includes('Electron');

    if(isBrowser){
      if(global.navigator.vendor !== 'Google Inc.')
        return O.error('Please use Chrome.');
    }

    if(isNode){
      O.crypto = require('crypto');
      O.Buffer = global.Buffer;
    }

    if(!global.isConsoleOverriden)
      O.overrideConsole();

    O.module.cache = O.obj();

    if(loadProject){
      O.project = O.urlParam('project');

      if(!O.projectTest(O.project))
        return O.error(`Illegal project name ${JSON.stringify(O.ascii(O.project))}".`);

      if(O.project == null){
        O.rf(`projects.txt`, (status, projects) => {
          if(status != 200) return O.error(`Failed to load projects list.`);

          O.title('Projects');
          O.sortAsc(O.sanl(projects)).forEach((project, index, projects) => {
            O.ceLink(O.body, O.projectToName(project), `/?project=${project}`);
            if(index < projects.length - 1) O.ceBr(O.body);
          });
        });
      }else{
        O.req(`/projects/${O.project}/main`).catch(O.error);
      }
    }
  },

  overrideConsole(){
    var global = O.global;
    var isNode = O.isNode;

    O.util = isNode ? require('util') : null;

    var console = global.console;
    var logOrig = console.log;

    var indent = 0;

    var logFunc = (...args) => {
      if(args.length === 0){
        logOrig('');
        return;
      }

      if(isNode){
        var indentStr = ' '.repeat(indent << 1);
        var str = O.inspect(args);

        str = O.sanl(str).map(line => {
          return `${indentStr}${line}`;
        }).join('\n');

        logOrig(str);
      }else{
        logOrig(...args);
      }

      return args[args.length - 1];
    };

    logFunc.inc = (val=1) => {
      indent += val;
    };

    logFunc.dec = (val=1) => {
      indent -= val;
      if(indent < 0) indent = 0;
    };

    logFunc.get = () => {
      return indent;
    };

    logFunc.set = i => {
      indent = i;
    };

    global.log = logFunc;
    global.isConsoleOverriden = 1;
  },

  inspect(arr){
    if(!O.isNode)
      throw new TypeError('Function "inspect" is available only in Node.js');

    var {util} = O;

    if(!(arr.length === 1 && typeof arr[0] === 'string'))
      arr = arr.map(val => util.inspect(val));

    return arr.join(' ');
  },

  title(title){
    O.body.innerHTML = '';
    var h1 = O.ce(O.body, 'h1');
    O.ceText(h1, title);
  },

  error(msg){
    O.body.classList.remove('has-canvas');
    O.body.style.backgroundColor = '#ffffff';

    O.title('Error Occured');
    O.ceText(O.body, msg);
    O.ceBr(O.body, 2);
    O.ceLink(O.body, 'Home Page', '/');
  },

  /*
    Project functions
  */

  uppercaseWords: ['fs', '2d', '3d'],

  projectToName(project){
    return project.split(/\-/g).map((word, index) => {
      if(O.shouldUpper(word)) word = word.toUpperCase();
      else if(index === 0) word = O.cap(word);

      return word;
    }).join(' ');
  },

  shouldUpper(word){ return O.uppercaseWords.includes(word); },
  projectTest(project){ return /^[\!-\~]+$/.test(project); },

  /*
    URL functions
  */

  href(){
    return window.VIRTUAL_URL || window.location.href;
  },

  urlParam(param, defaultVal=null){
    var url = O.href();
    var match = url.match(new RegExp(`[\\?\\&]${param}=([^\\&]*)`));

    if(match === null){
      if(new RegExp(`[\\?\\&]${param}(?:\\&|$)`).test(url))
        match = '';
    }else{
      match = window.unescape(match[1]);
    }

    if(match === null) return defaultVal;
    return match;
  },

  /*
    DOM functions
  */

  ge(selector){
    return O.doc.getElementById(selector);
  },

  qsa(parent, selector=null){
    if(selector === null){
      selector = parent;
      parent = O.doc;
    }

    return parent.querySelectorAll(selector);
  },

  ce(parent, tag, classNames=null){
    const elem = O.doc.createElement(tag);

    if(parent !== null)
      parent.appendChild(elem);

    if(classNames !== null){
      if(typeof classNames === 'string')
        classNames = classNames.split(' ');

      classNames.forEach(className => {
        if(className === '')
          return;
        
        elem.classList.add(className);
      });
    }

    return elem;
  },

  ceDiv(parent, classNames){
    return O.ce(parent, 'div', classNames);
  },

  ceBr(parent, num=1){
    while(num--) O.ce(parent, 'br');
  },

  ceHr(parent, classNames){
    return O.ce(parent, 'hr', classNames);
  },

  ceText(parent, text){
    var t = O.doc.createTextNode(text);
    parent.appendChild(t);
    return t;
  },

  ceLink(parent, label, href, classNames){
    var link = O.ce(parent, 'a', classNames);
    link.href = href;
    if(!(label === null || label === '')) O.ceText(link, label);
    return link;
  },

  ceInput(parent, type, classNames){
    var input = O.ce(parent, 'input', classNames);
    input.type = type;
    if(type === 'text') input.autocomplete = 'off';
    return input;
  },

  ceRadio(parent, name, value, label=null, classNames){
    var radio = O.ceInput(parent, 'radio', classNames);
    radio.name = name;
    radio.value = value;
    if(!(label === null || label === '')) O.ceText(parent, label);
    return radio;
  },

  ceH(parent, type, text=null, classNames){
    var h = O.ce(parent, `h${type}`, classNames);
    if(!(text === null || text === '')) O.ceText(h, text);
    return h;
  },

  ceLabel(parent, text=null, classNames){
    var label = O.ce(parent, 'label', classNames);
    if(!(text === null || text === '')) O.ceText(label, text);
    return label;
  },

  ceCanvas(enhanced=false){
    O.body.classList.add('has-canvas');

    var w = window.innerWidth;
    var h = window.innerHeight;
    var canvas = O.ce(O.body, 'canvas');
    var g = canvas.getContext('2d');

    canvas.width = w;
    canvas.height = h;

    var {style} = canvas;
    style.position = 'absolute';
    style.left = '0px';
    style.top = '0px';

    g.fillStyle = 'white';
    g.strokeStyle = 'black';
    g.fillRect(0, 0, w, h);

    if(enhanced)
      g = new O.EnhancedRenderingContext(g);

    return {w, h, g};
  },

  /*
    Request processing functions
  */

  urlTime(url){
    var char = url.indexOf('?') !== -1 ? '&' : '?';
    return `${url}${char}_=${Date.now()}`;
  },

  rf(file, isBinary, cb=null){
    if(cb === null){
      cb = isBinary;
      isBinary = 0;
    }

    var xhr = new window.XMLHttpRequest();

    if(isBinary){
      xhr.responseType = 'arraybuffer';
    }

    xhr.onreadystatechange = () => {
      if(xhr.readyState === 4){
        if(xhr.status === 200 && O.module.remaining !== 0)
          O.module.remaining--;

        if(isBinary)
          cb(xhr.status, O.Buffer.from(xhr.response));
        else
          cb(xhr.status, xhr.responseText);
      }
    };

    if(file.startsWith('/') && window.VIRTUAL_URL_BASE)
      file = `${window.VIRTUAL_URL_BASE}${file.substring(1)}`;

    xhr.open('GET', O.urlTime(file));
    xhr.send(null);
  },

  rfAsync(...args){
    return new Promise(res => {
      O.rf(...args, (status, code) => {
        if(status !== 200) return res(null);
        res(code);
      });
    });
  },

  rfLocal(file, isBinary, cb=null){
    if(cb === null){
      cb = isBinary;
      isBinary = 0;
    }

    O.rf(`/projects/${O.project}/${file}`, isBinary, cb);
  },

  async req(path){
    const cache = O.module.cache;
    const pathOrig = path;

    let script;

    if(path in cache) return cache[path];
    
    if(path.endsWith('.js')){
      script = await O.rfAsync(path);
    }else if((script = await O.rfAsync(`${path}.js`)) !== null){
      path += '.js';
      if(path in cache) return cache[path];
    }else{
      path += '/index.js';
      if(path in cache) return cache[path];
      script = await O.rfAsync(path);
    }

    if(script === null){
      O.error(`Failed to load script for project ${JSON.stringify(O.project)}`);
      return null;
    }

    path = path.split('/');
    path.pop();

    script = script.replace(/^const (?:O|debug) .+/gm, '');
    script = script.replace(/ \= require\(/g, ' \= await require(');

    var AsyncFunction = (async () => {}).constructor;

    var module = {exports: {}};
    var {exports} = module;

    var func = new AsyncFunction('window', 'document', 'Function', 'O', 'require', 'module', 'exports', script);
    await func(window, document, Function, O, require, module, exports);

    return cache[pathOrig] = module.exports;

    async function require(newPath){
      var resolvedPath;

      if(/^https?\:\/\//.test(newPath)){
        resolvedPath = newPath;
      }else if(newPath.startsWith('.')){
        var oldPath = path.slice();

        newPath.split('/').forEach(dir => {
          switch(dir){
            case '.': break;
            case '..': oldPath.pop(); break;
            default: oldPath.push(dir); break;
          }
        });

        resolvedPath = oldPath.join('/');
      }else{
        return null;
      }

      var exportedModule = await O.req(resolvedPath);

      return exportedModule;
    }
  },

  require(script, cb=O.nop){
    if(/\.js$/.test(script)){
      script = `/projects/${O.project}/${script}`;
    }else{
      script = `/projects/${script}/index.js`;
    }

    O.rf(script, false, (status, data) => {
      if(status !== 200)
        return O.error('Cannot load script.');

      var module = {
        exports: {}
      };

      var func = new Function('O', 'module', data);
      func(O, module);

      cb(module.exports);
    });
  },

  /*
    String functions
  */

  buff2ascii(buff){
    return [...buff].map(cc => {
      return O.sfcc(cc);
    }).join('');
  },

  ascii(str){
    return str.split('').map(char => {
      if(char >= ' ' && char <= '~') return char;
      return '?';
    }).join('');
  },

  sanl(str){
    return String(str).split(/\r\n|\r|\n/g);
  },

  sanll(str){
    return String(str).split(/\r\n\r\n|\r\r|\n\n/g);
  },

  pad(str, len, char='0'){
    str += '';
    if(str.length >= len) return str;
    return char.repeat(len - str.length) + str;
  },

  cap(str, lowerOthers=0){
    if(lowerOthers) str = str.toLowerCase();
    return `${str[0].toUpperCase()}${str.substring(1)}`;
  },

  indent(str, indent){ return `${' '.repeat(indent << 1)}${str}`; },

  /*
    Array functions
  */

  ca(len, func=O.nop){
    var arr = [];

    for(var i = 0; i !== len; i++)
      arr.push(func(i, i / len, len));

    return arr;
  },

  async caa(len, func){
    var arr = [];

    for(var i = 0; i !== len; i++)
      arr.push(await func(i, i / len, len));

    return arr;
  },

  shuffle(arr){
    var len = arr.length;

    for(var i = 0; i !== len; i++){
      var j = i + O.rand(len - i);
      var t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }

    return arr;
  },

  flatten(arr){
    var a = [];

    arr = arr.slice();

    while(arr.length !== 0){
      var e = arr.shift();

      if(!Array.isArray(e)){
        a.push(e);
        continue;
      }

      e.forEach((a, b) => arr.splice(b, 0, a));
    }

    return a;
  },

  last(arr, defaultVal=null){
    if(arr.length === 0) return defaultVal;
    return arr[arr.length - 1];
  },

  /*
    Random number generator
  */

  enhanceRNG(){
    O.enhancedRNG = 1;
    O.randState = O.Buffer.from(O.ca(32, () => Math.random() * 256));
    O.repeat(10, () => O.random());
  },

  randSeed(seed){
    this.rseed = seed | 0;
    O.randState = O.Buffer.alloc(0);
    O.repeat(10, () => O.random());
  },

  random(){
    if(!O.enhancedRNG)
      return Math.random();

    var st = O.randState;
    var val = read();

    if(O.rseed !== null){
      write(O.rseed);
    }else{
      write(Date.now());
      write(Math.random() * 2 ** 64);
    }

    O.randState = O.sha256(st);
    return val / 2 ** 64;

    function read(){
      var val = st[7];
      for(var i = 6; i !== -1; i--)
        val = val * 256 + st[i];
      return val;
    }

    function write(val){
      st[0] ^= val;
      for(var i = 1; i !== 8; i++)
        st[i] ^= val /= 256;
    }
  },

  rand(a=2, b=null){
    if(b !== null) return a + O.random() * (b - a + 1) | 0;
    return O.random() * a | 0;
  },

  randf(a=1, b=null){
    if(b !== null) return a + O.random() * (b - a);
    return O.random() * a;
  },

  randInt(start, prob){
    var num = start;
    while(O.randf() < prob) num++;
    return num;
  },

  randElem(arr, splice=0){
    var index = O.rand(arr.length);
    if(splice) return arr.splice(index, 1)[0];
    return arr[index];
  },

  randBuf(len){
    const buf = O.Buffer.alloc(len);
    for(let i = 0; i !== len; i++)
      buf[i] = O.rand(256);
    return buf;
  },

  /*
    Other functions
  */

  repeat(num, func){
    for(var i = 0; i !== num; i++)
      func(i, i / num, num);
  },

  async repeata(num, func){
    for(var i = 0; i !== num; i++)
      await func(i, i / num, num);
  },

  sleep(time){
    const t = Date.now();
    while(date.now() - t < time);
  },

  sleepa(time){
    return new Promise(res => {
      setTimeout(res, time);
    });
  },

  wait(time){ return O.sleep(time); },
  waita(time){ return O.sleepa(time); },

  bound(val, min, max){
    if(val < min) return min;
    if(val > max) return max;
    return val;
  },

  int(val, min=null, max=null){
    if(typeof val == 'object') val = 0;
    else val |= 0;
    if(min != null) val = O.bound(val, min, max);
    return val;
  },

  hsv(val, col=new Uint8Array(3)){
    var v = Math.round(val * (256 * 6 - 1)) | 0;
    var h = v & 255;

    if(v < 256) col[2] = 0, col[0] = 255, col[1] = h;
    else if(v < 256 * 2) col[2] = 0, col[1] = 255, col[0] = 255 - h;
    else if(v < 256 * 3) col[0] = 0, col[1] = 255, col[2] = h;
    else if(v < 256 * 4) col[0] = 0, col[2] = 255, col[1] = 255 - h;
    else if(v < 256 * 5) col[1] = 0, col[2] = 255, col[0] = h;
    else col[1] = 0, col[0] = 255, col[2] = 255 - h;

    return col;
  },

  hsvx(val){
    if(val === 0) return O.hsv(0);
    while(val < 1 / 49) val *= 49;
    return O.hsv(val - 1 / 64);
  },

  dist(x1, y1, x2, y2){
    var dx = x2 - x1;
    var dy = y2 - y1;

    return Math.sqrt(dx * dx + dy * dy);
  },

  enum(arr){
    const obj = O.obj();

    arr.forEach((name, index) => {
      obj[name] = index;
      obj[index] = name;
    });

    return obj;
  },

  while(func){
    return new Promise(res => {
      var test = async () => {
        if(await func()) return setTimeout(test);
        res();
      };

      test();
    });
  },

  commonProto(arr, calcProtos=1){
    if(arr.length === 0) return null;

    if(calcProtos) arr = arr.map(obj => O.proto(obj));
    if(arr.length === 1) return arr[0];

    return arr.reduce((prev, proto) => {
      if(prev === null || proto === null) return null;
      if(proto === prev) return prev;

      if(proto instanceof prev.constructor) return prev;
      if(prev instanceof proto.constructor) return proto;

      do{
        prev = O.proto(prev);
      }while(!(prev === null || proto instanceof prev.constructor));

      return prev;
    });
  },

  proxify(oldFunc, newFunc){
    return (...args) => {
      return newFunc(oldFunc, args);
    };
  },

  bool(val){ return Boolean(O.int(val)); },
  sortAsc(arr){ return arr.sort((elem1, elem2) => elem1 > elem2 ? 1 : elem1 < elem2 ? -1 : 0); },
  sortDesc(arr){ return arr.sort((elem1, elem2) => elem1 > elem2 ? -1 : elem1 < elem2 ? 1 : 0); },
  undupe(arr){ return arr.filter((a, b, c) => c.indexOf(a) === b); },
  rgb(...col){ return `#${col.map(val => O.pad((val | 0).toString(16), 2)).join('')}`; },
  binLen(a){ return a && (Math.log2(a) | 0) + 1; },
  raf(func){ return window.requestAnimationFrame(func); },
  obj(proto=null){ return Object.create(proto); },
  keys(obj){ return Reflect.ownKeys(obj); },
  cc(char, index=0){ return char.charCodeAt(index); },
  sfcc(cc){ return String.fromCharCode(cc); },
  hex(val, bytesNum){ return val.toString(16).toUpperCase().padStart(bytesNum << 1, '0'); },
  hypot(x, y){ return Math.sqrt(x * x + y * y); },
  proto(obj){ return Object.getPrototypeOf(obj); },

  allKeys(obj){
    const arr = [];

    while(obj !== null){
      arr.push(O.keys(obj));
      obj = O.proto(obj);
    }

    return arr;
  },

  /*
    Events
  */

  ael(target, type, func=null){
    if(func === null){
      func = type;
      type = target;
      target = window;
    }

    return target.addEventListener(type, func);
  },

  rel(target, type, func=null){
    if(func === null){
      func = type;
      type = target;
      target = window;
    }

    return target.removeEventListener(type, func);
  },

  pd(evt, stopPropagation=0){
    evt.preventDefault();
    if(stopPropagation) evt.stopPropagation();
  },

  /*
    Algorithms
  */
  
  sha256: (() => {
    const MAX_UINT = 2 ** 32;

    var hhBase = null;
    var kkBase = null;

    return sha256;

    function sha256(data){
      if(O.isNode && O.fastSha256){
        var hash = O.crypto.createHash('sha256');
        hash.update(data);
        return hash.digest();
      }

      return slowSha256(data);
    }

    function slowSha256(buff){
      if(!(buff instanceof O.Buffer))
        buff = new O.Buffer(buff);

      if(hhBase === null){
        hhBase = getArrH();
        kkBase = getArrK();
      }

      const hh = hhBase.slice();
      const kk = kkBase.slice();
      const w = new Uint32Array(64);

      getChunks(buff).forEach(chunk => {
        for(var i = 0; i !== 16; i++){
          w[i] = chunk.readUInt32BE(i << 2);
        }

        for(var i = 16; i !== 64; i++){
          var s0 = (rot(w[i - 15], 7) ^ rot(w[i - 15], 18) ^ (w[i - 15] >>> 3)) | 0;
          var s1 = (rot(w[i - 2], 17) ^ rot(w[i - 2], 19) ^ (w[i - 2] >>> 10)) | 0;

          w[i] = w[i - 16] + w[i - 7] + s0 + s1 | 0;
        }

        var [a, b, c, d, e, f, g, h] = hh;

        for(var i = 0; i !== 64; i++){
          var s1 = (rot(e, 6) ^ rot(e, 11) ^ rot(e, 25)) | 0;
          var ch = ((e & f) ^ (~e & g)) | 0;
          var temp1 = (h + s1 + ch + kk[i] + w[i]) | 0;
          var s0 = (rot(a, 2) ^ rot(a, 13) ^ rot(a, 22)) | 0;
          var maj = ((a & b) ^ (a & c) ^ (b & c)) | 0;
          var temp2 = (s0 + maj) | 0;

          h = g | 0;
          g = f | 0;
          f = e | 0;
          e = d + temp1 | 0;
          d = c | 0;
          c = b | 0;
          b = a | 0;
          a = temp1 + temp2 | 0;
        }

        [a, b, c, d, e, f, g, h].forEach((a, i) => {
          hh[i] = hh[i] + a | 0;
        });
      });

      return computeDigest(hh);
    }

    function getArrH(){
      var arr = firstNPrimes(8);

      arrPow(arr, 1 / 2);
      arrFrac(arr);

      return new Uint32Array(arr);
    }

    function getArrK(){
      var arr = firstNPrimes(64);

      arrPow(arr, 1 / 3);
      arrFrac(arr);

      return new Uint32Array(arr);
    }

    function getChunks(buff){
      var bits = buffToBits(buff);
      var len = bits.length;
      var k = getVarK(len);

      bits += '1' + '0'.repeat(k);

      var buffL = O.Buffer.alloc(8);
      buffL.writeUInt32BE(len / MAX_UINT, 0);
      buffL.writeUInt32BE(len % MAX_UINT, 4);

      bits += buffToBits(buffL);

      var chunks = (bits.match(/.{512}/g) || []).map(a => {
        return bitsToBuff(a);
      });

      return chunks;
    }

    function getVarK(len){
      for(var i = 0; i < 512; i++){
        if(!((len + i + 65) % 512)) return i;
      }
    }

    function computeDigest(a){
      var arr = [];
      var buff = O.Buffer.alloc(4);

      a.forEach(a => {
        buff.writeUInt32BE(a, 0);
        arr.push(buff[0], buff[1], buff[2], buff[3]);
      });

      return O.Buffer.from(arr);
    }

    function rot(a, b){
      return (a >>> b) | (a << 32 - b);
    }

    function arrPow(arr, pow){
      arr.forEach((a, i) => {
        a **= pow;
        arr[i] = a;
      });
    }

    function arrFrac(arr, bitsNum = 32){
      arr.forEach((a, i) => {
        a = a % 1 * 2 ** bitsNum;

        var bits = O.ca(bitsNum, i => {
          return !!(a & (1 << (bitsNum - i - 1))) | 0;
        }).join('');

        a = parseInt(bits, 2);

        arr[i] = a;
      });
    }

    function buffToBits(buff){
      return [...buff].map(byte => {
        return byte.toString(2).padStart(8, '0');
      }).join('');
    }

    function bitsToBuff(bits){
      return O.Buffer.from((bits.match(/\d{8}/g) || []).map(a => {
        return parseInt(a, 2);
      }));
    }

    function firstNPrimes(a){
      return O.ca(a, i => nthPrime(i + 1));
    }

    function nthPrime(a){
      for(var i = 1; a; i++){
        if(isPrime(i)) a--;
      }

      return i - 1;
    }

    function isPrime(a){
      if(a == 1) return false;

      for(var i = 2; i < a; i++){
        if(!(a % i)) return false;
      }

      return true;
    }
  })(),

  /*
    Function that does nothing
  */

  nop(){}
};

O.init(0);

module.exports = O;