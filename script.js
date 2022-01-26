// Fractal Sandbox by Szymon Ceranka
//
//  test random table with variable xor
//  print function with reference to affiliated cloud printing services
//  sell compute time on strong NVIDIA computer

'use strict';

let mainPane, loadPane;
//let userPane, userButton, sessionId;

const parameters = {
  balanceFactor: 1,

  //email: '',
  //password: '',
  //nickname: '',

  tileSize: 100,
  tileDetail: 10,

  formulaIndex: 1,

  colorIndex: 1,
  colorValue: {r: 0, g:0 , b: 0},
  colorPosition: 3,
};

const fractalPaletteLength = 1000;

const myRandomMaxSize = 100000000;
let myRandomPrepared = 0;
let myRandom = undefined;
function prepareRandom(size) {
  if (myRandom == undefined)
    myRandom = new Int16Array(myRandomMaxSize);
  if (size > myRandomMaxSize)
    size = myRandomMaxSize;
  if (myRandomPrepared < size) {
    for (let i = myRandomPrepared; i < size; i++)
      myRandom[i] = Math.random() * Formula.formTabSize;
    myRandomPrepared = size;
  }
}

class Formula {
  static get formTabSize() { return 0x4000; }
  constructor(a, b, c, d, e, f, p) {
    if (arguments.length == 0) {
      this.a = .9;
      this.b = 0;
      this.c = 0;
      this.d = .9;
      this.e = 0;
      this.f = 0;
      this.p = .81;
    }
    if (arguments.length == 1) {
      [a, b, c, d, e, f, p] = a.split(' ');
      this.a = parseFloat(a);
      this.b = parseFloat(b);
      this.c = parseFloat(c);
      this.d = parseFloat(d);
      this.e = parseFloat(e);
      this.f = parseFloat(f);
      this.p = parseFloat(p);
    }
    if (arguments.length > 1) {
      this.a = a;
      this.b = b;
      this.c = c;
      this.d = d;
      this.e = e;
      this.f = f;
      this.p = p;
    }
  }
  clone() {
    return new Formula(this.a, this.b, this.c, this.d, this.e, this.f, this.p);
  }
  toString() {
    return this.a + ' ' + this.b + ' ' + this.c + ' ' +  this.d + ' ' + this.e + ' ' + this.f + ' ' + this.p;
  }
  iterate(point) {
    return [
      this.a * point[0] + this.b * point[1] + this.e,
      this.c * point[0] + this.d * point[1] + this.f
    ];
  }
  fromPoints(points) {
    this.a = points[2][0] - points[0][0];
    this.b = points[1][0] - points[0][0];
    this.c = points[2][1] - points[0][1];
    this.d = points[1][1] - points[0][1];
    this.e = points[0][0];
    this.f = points[0][1];
  }
  getPoints() {
    return [
      this.iterate([0, 0]),
      this.iterate([0, 1]),
      this.iterate([1, 0]),
      this.iterate([-1, 0])
    ];
  }
  getArea() {
    return Math.pow(Math.abs(this.b * this.c - this.a * this.d), parameters.balanceFactor);
  }
  setPoint(dx, dy, n) {
    function sp(n) {
      p[n][0] += dx;
      p[n][1] += dy;
    }
    let p = this.getPoints();
    if (!n)
      for (let i in p)
        sp(i);
    if (n === 1)
      sp(1);
    if (n > 1) {
      sp(n);
      dx = -dx;
      dy = -dy;
      sp(5 - n);
    }
    this.fromPoints(p);
  }
  getRotation() { 
    let a1 = Math.atan2(this.c, this.a) * 180 / Math.PI;
    let a2 = Math.atan2(-this.b, this.d) * 180 / Math.PI;
    let a3 = Math.atan2(this.d, this.b) * 180 / Math.PI - 90;
    return [a1, a2, a3];
  }
}

class Fractal {
  constructor() {
    this.formulas = [];
    const args = arguments[0].replace(/#/g, '\n').split('\n');
    for (let arg of args)
      this.formulas.push(new Formula(arg));
  }
  toString() {
    let ret = '';
    for (let formula of this.formulas)
      ret += formula.toString() + '#';
    ret = ret.substr(0, ret.length - 1);
    return ret;
  }
  formulaPoints() {
    let points = [];
    for (let formula of this.formulas)
      points = points.concat(formula.getPoints());
    return points;
  }
  formulaSelections() {
    const selections = [];
    for (let i in this.formulas)
      for (let j = 0; j <= 3; j++)
        selections.push({ formula: i, point: j });
    return selections;
  }
  prepare() {
    let area = 0;
    for (let formula of this.formulas)
      area += formula.getArea();
    for (let formula of this.formulas)
      formula.p = formula.getArea() / area;
    this.x = 0;
    this.y = 0;
    this.formtab = new Uint8Array(Formula.formTabSize);
    for (let i = 0, f = -1, v = 0; i < Formula.formTabSize; i++) {
      if (i / Formula.formTabSize >= v) {
        v += this.formulas[++f].p;
      }
      this.formtab[i] = f;
    }
    this.startMilliseconds = getMilliseconds();
  }
  calculateWithMyRandom(points, offset) {
    let ptr = points.length;
    prepareRandom(offset + ptr / 2);
    let rndptr = offset;
    let x = this.x, y = this.y;
    while (ptr) {
      const f = this.formulas[this.formtab[myRandom[rndptr++]]];
      const xx = f.a * x + f.b * y + f.e;
      const yy = f.c * x + f.d * y + f.f;
      y = points[--ptr] = yy;
      x = points[--ptr] = xx;
    }
    this.x = x; this.y = y;
  }
  calculateWithMathRandom(points) {
    let ptr = points.length;
    let x = this.x, y = this.y;
    while (ptr) {
      const f = this.formulas[this.formtab[(Math.random() * Formula.formTabSize) | 0]];
      const xx = f.a * x + f.b * y + f.e;
      const yy = f.c * x + f.d * y + f.f;
      y = points[--ptr] = yy;
      x = points[--ptr] = xx;
    }
    this.x = x; this.y = y;
  }
  calculate(points, offset) {
    if (offset + points.length / 2 <= myRandomMaxSize)
      this.calculateWithMyRandom(points, offset)
    else
      this.calculateWithMathRandom(points);
  }
}

class Viewport {
  constructor(ctx, zoom) {
    this.ctx = ctx;
    this.scale = 1;
    this.shiftx = 0;
    this.shifty = 0;
    this.manualScale = 1;
    this.manualShiftx = 0;
    this.manualShifty = 0;
    this.autoZoom = zoom || 0.9;
    this.minMax = [[0, 0], [1, 1]];
    this.drawnPointsCount = 0;
    this.infinite = false;
    this.forceRedrawPalette = false;
    this.finishStatsShown = false;
    this.fractalString = '';
  }
  toScreen(p) {
    return [p[0] * this.scale + this.shiftx, -p[1] * this.scale + this.shifty];
  }
  fromScreen(p) {
    return [(p[0] - this.shiftx) / this.scale, (-p[1] + this.shifty) / this.scale];
  }
  resetManual() {
    this.manualScale = 1;
    this.manualShiftx = 0;
    this.manualShifty = 0;
    this.updateTransform();
  }
  setMinMax(minMax) {
    this.minMax = minMax;
    this.updateTransform();
  }
  updateTransform() {
    const sx = this.ctx.canvas.width / 2;
    const sy = this.ctx.canvas.height / 2;
    const dx = (this.minMax[1][0] - this.minMax[0][0]) / 2;
    const dy = (this.minMax[1][1] - this.minMax[0][1]) / 2;
    const fx = (this.minMax[1][0] + this.minMax[0][0]) / 2;
    const fy = (this.minMax[1][1] + this.minMax[0][1]) / 2;
    this.scale = Math.min(sx / dx, sy / dy) * this.autoZoom * this.manualScale;
    this.shiftx = sx - fx * this.scale + this.manualShiftx;
    this.shifty = sy + fy * this.scale + this.manualShifty;
  }
  prepare(fractal) {
    //this.t1 = 0; this.t2 = 0; this.t3 = 0; this.t4 = 0;
    this.drawnPointsCount = 0;
    this.tabmax = 0;
    this.width  = this.ctx.canvas.width;
    this.height = this.ctx.canvas.height;
    this.tab = new Int32Array(this.width * this.height);
    this.maxpoints = 100 * getViewArea(this);
    const numpoints = 5 * getViewArea(this);
    if (this.points == undefined || this.points.length != 2 * numpoints)
      this.points = new Float64Array(2 * numpoints); // two coordinates per point
    if (this.imageData == undefined || this.imageData.width != this.width || this.imageData.height != this.height)
      this.imageData = this.ctx.createImageData(this.width, this.height);
    this.autoScaleRequired = true;
    this.finishStatsShown = false;
    if (fractal) {
      this.fractal = fractal;
      this.fractalString = this.fractal.toString();
    }
    this.fractal.prepare();
  }
  doCalculatePoints() {
    this.fractal.calculate(this.points, this.drawnPointsCount);
  }
  doAutoScale() {
    this.autoScaleRequired = false;
    const minMax = getBoundingBoxFrom1DArray(this.points);
    this.setMinMax(minMax);
  }
  doSumPoints() {
    const thisPointsLength = this.points.length;
    for (let i = 0; i < thisPointsLength; i += 2) {
      const x = ( this.points[i    ] * this.scale + this.shiftx) | 0;
      const y = (-this.points[i + 1] * this.scale + this.shifty) | 0;
      if (x > 0 && x <= this.width && y > 0 && y <= this.height) {
        const j = x - 1 + this.width * (y - 1);
        if (++this.tab[j] > this.tabmax)
          this.tabmax = this.tab[j];
      }
    }
  }
  doCalculateColors() {
    const palData = new Int32Array(this.imageData.data.buffer);
    const palmul = (fractalPaletteLength - 1) / this.tabmax;
    if (this.tabmax) {
      const thisTabLength = this.tab.length;
      for (let i = 0; i < thisTabLength; i++) {
        palData[i] = fractalPalette[(this.tab[i] * palmul) | 0];
      }
    }
  }
  doPutImageData() {
    this.ctx.putImageData(this.imageData, 0, 0);
  }
  finished() {
    return this.drawnPointsCount >= this.maxpoints && !this.infinite;
  }
  draw() {
    let startms = getMilliseconds();
    if (this.finished()) {
      if (this.forceRedrawPalette) {
        this.redrawPalette();
      }
      if (!this.finishStatsShown) {
        document.title = Math.floor(this.drawnPointsCount / 1000000) + ' mp ' + (getMilliseconds() - this.fractal.startMilliseconds) + ' ms';
        //document.title = (getMilliseconds() - this.fractal.startMilliseconds) + ' ms ' + (this.t1 + this.t2 + this.t3) + ' ' + this.t1 + ' ' + this.t2 + ' ' + this.t3;
        this.finishStatsShown = true;
      }
      return;
    }
    //document.title = ~~(100 * this.drawnPointsCount / this.maxpoints) + '%';
    this.doCalculatePoints();
    if (this.autoScaleRequired) {
      this.doAutoScale();
    }
    //let tt1 = getMilliseconds();
    //this.t1 += tt1 - startms;
    this.doSumPoints();
    //let tt2 = getMilliseconds();
    //this.t2 += tt2 - tt1; 
    this.doCalculateColors();
    this.doPutImageData();
    //let tt3 = getMilliseconds();
    //this.t3 += tt3 - tt2;
    this.drawnPointsCount += this.points.length / 2;
    document.title = Math.floor((this.points.length / 2 )/ (getMilliseconds() - startms));
  }
  setForceRedrawPalette() {
    this.forceRedrawPalette = true;
  }
  redrawPalette() {
    this.doCalculateColors();
    this.doPutImageData();
    this.forceRedrawPalette = false;
  }
}

function getViewArea(view) { return view.width * view.height; }

function getBoundingBoxFrom2DArray(points) {
  let minx = 1e10, miny = 1e10, maxx = -1e10, maxy = -1e10;
  for (let i = 0; i < points.length; i++) {
    const x = points[i][0], y = points[i][1];
    if (x < minx) minx = x; if (x > maxx) maxx = x;
    if (y < miny) miny = y; if (y > maxy) maxy = y;
  }
  return [[minx, miny], [maxx, maxy]];
}

function getBoundingBoxFrom1DArray(points) {
  let minx = 1e10, miny = 1e10, maxx = -1e10, maxy = -1e10;
  for (let i = 0; i < points.length - 1000; i += 2) {
    const x = points[i], y = points[i + 1];
    if (x < minx) minx = x; if (x > maxx) maxx = x;
    if (y < miny) miny = y; if (y > maxy) maxy = y;
  }
  return [[minx, miny], [maxx, maxy]];
}

function getMilliseconds() { return Number(new Date()); }

class cHistory {
  constructor() {
    this.stack = [];
    this.pointer = 0;
  }
  store() {
    if (this.pointer < this.stack.length - 1)
      this.stack.splice(this.pointer + 1);
    let item = {
      palette: JSON.stringify(paletteKeys),
      fractal: viewFrac.fractalString,
    };
    this.stack.push(item);
    this.pointer = this.stack.length - 1;
  }
  restore(item) {
    paletteKeys = JSON.parse(item.palette);
    fractal = new Fractal(item.fractal);
    fractalPalette = createPaletteFromKeys(paletteKeys);
    windowResize();
  }
  back() {
    if (this.pointer > 0) {
      this.pointer--;
      this.restore(this.stack[this.pointer]);
    }
  }
  forward() {
    if (this.pointer < this.stack.length - 1) {
      this.pointer++;
      this.restore(this.stack[this.pointer]);
    }
  }
}

let histor = new cHistory();

let fractal;
let fractalPalette = [];
let paletteKeys = [];

let selectedFormula = null;
let lastSelectedFormula = null;

let selectedColor = null;
let lastSelectedColor = 0;

let drag = {
  state: false, // false, formula, viewform, viewfrac, color, colorpicker
  startPoint: [0, 0]
};

let viewFrac, viewForm;

class cPaletteKey {
  constructor(index, r, g, b) {
    this.index = index;
    this.r = r;
    this.g = g;
    this.b = b;
  }
}

function findNearestPoint(points, p, distanceThreshold) {
  function pointDistance(p1, p2) { let dx = p1[0] - p2[0], dy = p1[1] - p2[1]; return dx * dx + dy * dy; }
  let nearestDistance = distanceThreshold, nearestIndex = null;
  for (let i = 0; i < points.length; i++) {
    let d = pointDistance(points[i], p);
    if (d < nearestDistance) { nearestDistance = d; nearestIndex = i; } 
  }
  return nearestIndex;
}

function selectNearestFormula(p) {
  const nearestIndex = findNearestPoint(fractal.formulaPoints(), p, 10 / viewForm.scale);
  selectedFormula = (nearestIndex != null) ? fractal.formulaSelections()[nearestIndex] : null;
  if (selectedFormula) {
    lastSelectedFormula = fractal.formulaSelections()[nearestIndex];
  }
}

function selectNearestColor(p) {
  const points = [];
  for (let key of paletteKeys) {
    points.push([paletteEditor.getX(key.index), 10]);
  }
  selectedColor = findNearestPoint(points, p, 1000);
  if (selectedColor != null) {
    lastSelectedColor = selectedColor;
    parameters.colorValue = paletteKeys[selectedColor];
    const state = drag.state;
    paletteEditor.colorPicker.refresh();
    drag.state = state;
  }
}

let lastForm = '';
function onPointerMove(e) {
  if (e.target.id == 'canvasForm') {
    let mousePoint = viewForm.fromScreen([e.offsetX, e.offsetY]);
    if (!drag.state) {
      selectNearestFormula(mousePoint);
    } 
    if (drag.state == 'formula') {
      fractal.formulas[selectedFormula.formula] = dragFormula.clone();
      let dx = mousePoint[0] - drag.startPoint[0];
      let dy = mousePoint[1] - drag.startPoint[1];
      fractal.formulas[selectedFormula.formula].setPoint(dx,dy,selectedFormula.point);
      drawMainFractal();
    }
    if (drag.state == 'viewform') {
      viewForm.manualShiftx = drag.startPoint[0] + e.offsetX;
      viewForm.manualShifty = drag.startPoint[1] + e.offsetY;
      resizeFormulas();
      return;
    }
    drawFormulas();
    const form = (selectedFormula != null) ? JSON.stringify(fractal.formulas[selectedFormula.formula]) : '';
    if (form != '' && form != lastForm) {
      lastForm = form;
      let r = fractal.formulas[selectedFormula.formula].getRotation();
      console.log(r[0], r[1], r[2])
    }
  }
  if (e.target.id == 'canvasFrac' && drag.state == 'viewfrac') {
    viewFrac.manualShiftx = drag.startPoint[0] + e.offsetX;
    viewFrac.manualShifty = drag.startPoint[1] + e.offsetY;
    drawMainFractal();
  }
  if (e.target.id == 'canvasColor' && !drag.state) {
    selectNearestColor([e.offsetX, e.offsetY]);
    drawColorEditor();
  }
}

function onWindowPointerMove(e) {
  if (drag.state == 'color') {
    const p = paletteKeys[drag.colorIndex];
    let newIndex = paletteEditor.getIndex(e.screenX - 8);
    if (drag.colorIndex > 0 && newIndex <= paletteKeys[drag.colorIndex - 1].index) {
      newIndex = paletteKeys[drag.colorIndex - 1].index + 1;
    }
    if (drag.colorIndex < paletteKeys.length - 1 && newIndex >= paletteKeys[drag.colorIndex + 1].index) {
      newIndex = paletteKeys[drag.colorIndex + 1].index - 1;
    }
    p.index = newIndex;
    fractalPalette = createPaletteFromKeys(paletteKeys);
    drawColorEditor();
    viewFrac.setForceRedrawPalette();
  }
  if (drag.state && e.buttons == 0) {
    drag.state = false;
  }
}

let dragFormula;

function onPointerDown(e) {
  function leftMouseButtonClicked() { return e.button == 0; }
  function rightMouseButtonClicked() { return e.button == 2; }
  if (e.target.id == 'canvasForm') {
    if (leftMouseButtonClicked()) {
      let mousePoint = viewForm.fromScreen([e.offsetX, e.offsetY]);
      selectNearestFormula(mousePoint);
      if (selectedFormula) {
        drag.state = 'formula';
        drag.startPoint = mousePoint;
        dragFormula = fractal.formulas[selectedFormula.formula].clone();
      }
      if (!selectedFormula) {
        drag.state = 'viewform';
        drag.startPoint[0] = viewForm.manualShiftx - e.offsetX;
        drag.startPoint[1] = viewForm.manualShifty - e.offsetY;
      }
    }
    if (rightMouseButtonClicked()) {
      viewForm.resetManual();
      resizeFormulas();
    }
  }
  if (e.target.id == 'canvasFrac') {
    if (leftMouseButtonClicked()) {
      drag.state = 'viewfrac';
      drag.startPoint[0] = viewFrac.manualShiftx - e.offsetX;
      drag.startPoint[1] = viewFrac.manualShifty - e.offsetY;
    }
    if (rightMouseButtonClicked()) {
      viewFrac.resetManual();
      drawMainFractal();
    }
  }
  if (e.target.id == 'canvasColor') {
    if (leftMouseButtonClicked()) {
      selectNearestColor([e.offsetX, e.offsetY]);
      if (selectedColor != null) {
        drag.state = 'color';
        drag.colorIndex = selectedColor;
      }
    }
  }
}

function onPointerUp(e) {
  if (drag.state) {
    if (drag.state == 'formula') {
      resizeFormulas();
    }
    if (['formula', 'color', 'colorpicker'].includes(drag.state)) {
      histor.store();
    }
    drag.state = false;
  }
}

let doZoomForm = false;
let doZoomFrac = false;

function onWheel(e) {
  function zoomView(view) {
    let p0 = view.fromScreen([e.offsetX, e.offsetY]);
    view.manualScale *= delta;
    view.updateTransform();
    let p = view.toScreen(p0);
    view.manualShiftx += e.offsetX - p[0];
    view.manualShifty += e.offsetY - p[1];
    view.updateTransform();
  }
  let delta = (e.deltaY < 0) ? 1.1 : 1 / 1.1;
  if (e.target.id == 'canvasForm') {
    zoomView(viewForm);
    doZoomForm = true;
    //resizeFormulas();
  }
  if (e.target.id == 'canvasFrac') {
    zoomView(viewFrac);
    doZoomFrac = true;
    //drawMainFractal();
  }
}

function drawCage(view) {
  let p1 = view.toScreen([-1,-1]);
  let p2 = view.toScreen([0,0]);
  let p3 = view.toScreen([1,1]);
  let ctx = view.ctx;
  ctx.strokeStyle = 'lightgrey';
  ctx.beginPath();    
  ctx.moveTo(p1[0],p1[1]);
  ctx.lineTo(p1[0],p3[1]);
  ctx.lineTo(p3[0],p3[1]);
  ctx.lineTo(p3[0],p1[1]);
  ctx.lineTo(p1[0],p1[1]);
  ctx.moveTo(p2[0],p1[1]);
  ctx.lineTo(p2[0],p3[1]);
  ctx.moveTo(p1[0],p2[1]);
  ctx.lineTo(p3[0],p2[1]);
  ctx.stroke();
}

function drawFormula(view, p) {
  let p0 = view.toScreen(p[0]);
  let p1 = view.toScreen(p[1]);
  let p2 = view.toScreen(p[2]);
  let p3 = view.toScreen(p[3]);
  let ctx = view.ctx;
  ctx.beginPath();    
  ctx.moveTo(p0[0],p0[1]);
  ctx.lineTo(p1[0],p1[1]);
  ctx.lineTo(p2[0],p2[1]);
  ctx.lineTo(p3[0],p3[1]);
  ctx.lineTo(p1[0],p1[1]);
  ctx.stroke();
}

function drawFormulas(view = viewForm) {
  let ctx = view.ctx;
  ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
  ctx.lineWidth = 1;
  drawCage(view);
  for (let i in fractal.formulas) {
    let points = fractal.formulas[i].getPoints();
    ctx.strokeStyle = (selectedFormula && i == selectedFormula.formula) ? 'orange' : 'black';
    drawFormula(view,points);    
  }
  if (selectedFormula) {
    ctx.strokeStyle = 'red';
    let p = view.toScreen(fractal.formulas[selectedFormula.formula].getPoints()[selectedFormula.point]);
    ctx.beginPath();
    ctx.arc(p[0], p[1], 2 /* CircleSize */, 0, 2 * Math.PI);
    ctx.stroke();
  }
}

function resizeFormulas(view = viewForm) {
  if (view.manualScale == 1 && view.manualShiftx == 0 && view.manualShifty == 0) {
    let points = fractal.formulaPoints().concat([[-1, -1], [1, 1]]);
    let minMax = getBoundingBoxFrom2DArray(points);
    view.setMinMax(minMax);
  }
  else {
    view.updateTransform();
  }
  drawFormulas(view);
}

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

class cPaletteEditor {
  constructor() {
    this.maxx = 0;
  }
  setMaxX(maxx) {
    this.maxx = maxx;
  }
  getX(i) {
    return  (this.maxx + 1) * i / fractalPaletteLength;
  }
  getIndex(x) {
    if (x < 0) x = 0;
    if (x >= this.maxx) x = this.maxx;
    return (x * fractalPaletteLength / (this.maxx + 1)) | 0;
  }
}

let paletteEditor = new cPaletteEditor();

function drawColorEditor() {
  localStorage.lastpalette = JSON.stringify(paletteKeys);
  const id = 'canvasColor';
  const c  = document.getElementById(id);
  c.width = c.parentElement.clientWidth;
  c.height = c.parentElement.clientHeight;
  const d = 5;
  const h = c.height;
  paletteEditor.setMaxX(c.width);
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.setLineDash([]);
  ctx.lineWidth = 1;
  for (let x = 0; x < c.width; x++) {
    const i = paletteEditor.getIndex(x);
    const rgb = fractalPalette[i];
    const hex = rgbToHex(rgb & 0xff, (rgb >> 8) & 0xff, (rgb >> 16) & 0xff);
    ctx.fillStyle = hex;
    ctx.fillRect(x, 0, x, c.height);
  }
  for (let i in paletteKeys) {
    if (i == selectedColor) {
      ctx.lineWidth = 4;
    }
    else {
      ctx.lineWidth = 1;
    }
    const key = paletteKeys[i];
    const x = paletteEditor.getX(key.index);
    const rgb = key.r + key.g + key.b;
    ctx.beginPath();
    ctx.strokeStyle = rgb > 1.5 * 0xff ? 'black' : 'white';
    ctx.moveTo(x - d, 0);
    ctx.lineTo(x, d);
    ctx.lineTo(x + d, 0);
    ctx.stroke();
  }
}

function setupCanvas(id) {
  const c = document.getElementById(id);
  c.onpointermove = onPointerMove;
  c.onpointerdown = onPointerDown;
  c.addEventListener('wheel', onWheel, {passive:true});
  c.oncontextmenu = () => {return false};
  return document.getElementById(id).getContext('2d');
}

function windowResize() {
  function setWidthHeight(id, width, height) { 
    const el = document.getElementById(id);
    if (el.width != width)   el.width = width; 
    if (el.height != height) el.height = height; 
  }
  let width = window.innerWidth;
  let height = window.innerHeight;
  if (width > height) 
    width /= 2; 
  else 
    height /= 2;
  setWidthHeight('canvasFrac', width, height);
  setWidthHeight('canvasForm', width, height);
  drawMainFractal();
  resizeFormulas();
  drawColorEditor();
}

function documentKeyDown(e) {
  if (e.keyCode == 27) { // Esc
    if (drag.state == 'formula') {
      drag.state = false;
      fractal.formulas[selectedFormula.formula] = dragFormula;
      drawFormulas();
    }
    if (fractalSelector.active) {
      fractalSelector.hide();
    }
  }
}

function addFormula() {
  fractal.formulas.push(new Formula());
  windowResize();
  histor.store();
}

function removeFormula(sel) {
  if (sel != null && fractal.formulas.length > 2) {
    fractal.formulas.splice(sel.formula,1);
    windowResize();
    histor.store();
  }
  selectedFormula = null;
  lastSelectedFormula = null;
}

function windowKeyPress(e) {
  const c = String.fromCharCode(e.keyCode);
  if (c == 'm') {
    toggleMainPane();
  }
  if (c == 'l') {
    if (!fractalSelector.active) { fractalSelector.show(); } else { fractalSelector.hide(); }
  }
  if (c == 's') {
    saveFractal();
  }
  if (c == 'd') {
    downloadImage();
  }
  if (c == 'z') {
    histor.back();
  }
  if (c == 'y') {
    histor.forward();
  }
  if (c == '+' || c == '=') {
    addFormula();
  }
  if (c == '-') {
    removeFormula(selectedFormula);
  }
  if (c == 'i') {
    viewFrac.infinite = !viewFrac.infinite;
  }
  if (c == 'c') {
    toggleColorEditor();
  }
  if (c == 'a') {
    addColor();
  }
  if (c == 'x') {
    removeColor();
  }
}

function drawMainFractal() {
  viewFrac.prepare(fractal);
}

function computeInBackground() {
  if (doZoomFrac) {
    viewFrac.prepare(fractal);
    doZoomFrac = false;
  }
  if (fractalSelector.active) {
    fractalSelector.computeInBackground();
  }
  else {
    if (viewFrac.fractalString != fractal.toString()) {
      viewFrac.prepare(fractal);
      localStorage.lastFractal = viewFrac.fractalString;
    }
    viewFrac.draw();
  }
  if (doZoomForm) {
    resizeFormulas();
    doZoomForm = false;
  }
  setTimeout(computeInBackground,1);
}

class FractalSelectorItem {
  constructor(key, value) {
    this.key = key;
    this.value = value;
  }
  createCanvas(div, size) {
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('id', this.key);
    this.canvas.setAttribute('name', 'selectFractal');
    this.canvas.setAttribute('style', 'border: 1px dotted Grey; display: inline');
    this.canvas.width = size;
    this.canvas.height = size;
    this.canvas.setAttribute('onClick', 'loadFractal(\'' + this.value + '\');');
    div.appendChild(this.canvas);
    this.canvas = document.getElementById(this.key);
    this.viewPort = new Viewport(this.canvas.getContext('2d'));
    this.viewPort.prepare(new Fractal(this.value));
    this.viewPort.draw();
    this.detail = 1;
  }
  updateSize(size) {
    this.canvas.width = size;
    this.canvas.height = size;
    this.viewPort.prepare();
    this.viewPort.draw();
    this.detail = 1;
  }
  increaseDetail() {
    this.viewPort.draw();
    this.detail++;
  }
}

class FractalSelector {
  constructor() {
    this.active = false;
    this.items = [];
  }
  update() {
    function isFractalKey(key) { 
      return key.substr(0,8) == 'fractal#';
    }
    function updateItem(table, key, value) {
      for (let item of previousItems)
        if (item.key == key && item.value == value) {
          table.push(item);
          return;
        }
      table.push(new FractalSelectorItem(key, value));
    }
    const previousItems = this.items;
    this.items = [];
    for (let i = 0; i<localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!isFractalKey(key)) continue;
      const value = localStorage[key];
      updateItem(this.items, key, value);
    }
    this.items.sort((a, b) => { if (a.key < b.key) return -1; return a.key > b.key; });
    this.updated = false;
    // update items in fractalSelectorDiv
  }
  show() {
    this.active = true;
    document.getElementById('mainDiv').style.display = 'none';
    document.getElementById('fractalSelectorDiv').style.display = '';
    this.update();
  }
  hide() {
    this.active = false;
    document.getElementById('fractalSelectorDiv').style.display = 'none';
    document.getElementById('mainDiv').style.display = '';
  }
  toggle() {
    if (this.active)
      this.hide();
    else
      this.show();
  }
  computeInBackground() {
    if (this.updated)
      return;
    const div = document.getElementById('fractalSelectorDiv');
    for (let item of this.items) {
      if (!item.canvas) {
        item.createCanvas(div, parameters.tileSize);
        return;
      }
      if (item.canvas.width != parameters.tileSize) {
        item.updateSize(parameters.tileSize);
        return;
      }
    }
    for (let item of this.items) {
      if (item.detail < parameters.tileDetail) {
        item.increaseDetail();
        return;
      }
    }
    this.updated = true;
  }
}

const fractalSelector = new FractalSelector();

function downloadImage() {
  document.getElementById('download').href = document.getElementById('canvasFrac').toDataURL('image/jpg');
  document.getElementById('download').click();
}

function saveFractal() {
  let key = 'fractal#' + new Date().toISOString();
  localStorage.setItem(key, fractal.toString());
}

function loadFractal(fract) {
  fractalSelector.hide();
  viewFrac.drawnPointsCount = 0;
  viewFrac.resetManual();
  viewForm.resetManual();
  fractal = new Fractal(fract);
  windowResize();
  histor.store();
}

function coeffMul(v1, v2, coeff) {
  return v1 * (1 - coeff) + v2 * coeff;
}

function createPaletteFromKeys(keys) {
  function fmul(r, g, b, a) { return (r << 0) + (g << 8) + (b << 16) + (a << 24); }
  keys.sort(function(a, b){if (a.index < b.index) return -1; return a.index > b.index;});
  const palette = [];
  const firstKey = keys[0];
  const lastKey = keys[keys.length - 1];
  for (let i = 0; i <= firstKey.index; i++)
    palette.push(fmul(firstKey.r, firstKey.g, firstKey.b, 0xff));
  for (let i = 1; i < keys.length; i++) {
    const prevKey = keys[i - 1];
    const nextKey = keys[i];
    const indexDifference = nextKey.index - prevKey.index;
    if (indexDifference == 0)
      continue;
    for (let j = prevKey.index + 1; j <= nextKey.index; j++) {
      const coeff = (j - prevKey.index) / indexDifference;
      const r = coeffMul(prevKey.r, nextKey.r, coeff);
      const g = coeffMul(prevKey.g, nextKey.g, coeff);
      const b = coeffMul(prevKey.b, nextKey.b, coeff);
      palette.push(fmul(r, g, b, 0xff));
    }
  }
  for (let i = lastKey.index + 1; i < 1000; i++)
    palette.push(fmul(lastKey.r, lastKey.g, lastKey.b, 0xff));
  return palette;
}

/*function memoryTest() {
  let memoryTestStepSize = 100 * 1000 * 1000;
  const t = [];
  while (true) 
    try {
      t.push(new Int8Array(memoryTestStepSize));
    } catch (error) {
      alert('failure after allocating ' + memoryTestStepSize * t.length +  ' bytes');
      return;
    }
}

function sendXHR(message) {
  let xhrobj = new XMLHttpRequest();;
  xhrobj.open('POST', 'user.php', true);
  xhrobj.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  xhrobj.send(message);
  xhrobj.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      alert(xhrobj.responseText);
    }
  }
}

function getSessionStatus() {
  let xhrobj = new XMLHttpRequest();;
  xhrobj.open('POST', 'user.php', true);
  xhrobj.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  xhrobj.send('');
  xhrobj.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      alert(xhrobj.responseText);
    }
  }
}*/

function toggleDisplay(id) {
  const el = document.getElementById(id);
  const newstate = el.style['display'] == 'none';
  el.style['display'] = newstate ? '' : 'none';
  return newstate;
}

function toggleColorEditor() {
  if (toggleDisplay('canvasColorDiv')) {
    drawColorEditor();
    paletteEditor.colorPicker.hidden = false;
    paletteEditor.buttonAddColor.hidden = false;
    paletteEditor.buttonRemoveColor.hidden = false;
    } 
  else {
    paletteEditor.colorPicker.hidden = true;
    paletteEditor.buttonAddColor.hidden = true;
    paletteEditor.buttonRemoveColor.hidden = true;
    }
}

function toggleMainPane() {
  mainPane.hidden = ~mainPane.hidden;
}

function addColorAt(index) {
  let i = 0;
  while (i < paletteKeys.length - 1 && paletteKeys[i].index < index) i++;
  const rgb = fractalPalette[index];
  paletteKeys.splice(i, 0, new cPaletteKey(index, rgb & 0xff, (rgb >> 8) & 0xff, (rgb >> 16) & 0xff));
  fractalPalette = createPaletteFromKeys(paletteKeys);
  drawColorEditor();
  viewFrac.setForceRedrawPalette();
  histor.store();
}

function addColor() {
  if (paletteEditor.colorPicker.hidden) return;
  let i = lastSelectedColor;
  if (i == paletteKeys.length - 1) i--;
  addColorAt(((paletteKeys[i].index + paletteKeys[i + 1].index) / 2) | 0);
}

function removeColor() {
  if (paletteEditor.colorPicker.hidden) return;
  if (paletteKeys.length > 2) {
    paletteKeys.splice(lastSelectedColor, 1);
    if (lastSelectedColor > 0) {
      lastSelectedColor--;
    }
    fractalPalette = createPaletteFromKeys(paletteKeys);
    drawColorEditor();
    viewFrac.setForceRedrawPalette();
    histor.store();
    }
}

function jsMain() {
  if (localStorage.lastpalette) {
    paletteKeys = JSON.parse(localStorage.lastpalette);
  }
  else {
    paletteKeys.push(new cPaletteKey(  0, 0xff, 0xff, 0xff));
    paletteKeys.push(new cPaletteKey(250, 0,    0,    0xff));
    paletteKeys.push(new cPaletteKey(500, 0xff, 0,    0   ));
    paletteKeys.push(new cPaletteKey(750, 0xff, 0xff, 0   ));
    paletteKeys.push(new cPaletteKey(999, 0xff, 0xff, 0xff));
  }
  fractalPalette = createPaletteFromKeys(paletteKeys);
  parameters.colorValue = paletteKeys[0];

  window.addEventListener('pointermove', onWindowPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  window.onresize = windowResize;
  window.onkeypress = windowKeyPress;
  document.onkeydown = documentKeyDown;

  setupCanvas('canvasColor');
  viewFrac = new Viewport(setupCanvas('canvasFrac'));
  viewForm = new Viewport(setupCanvas('canvasForm'), .6);
  
  let initFract = '-.653 .458 .270 .685 .374 .513#-.151 -.382 -.123 .239 .278 .426#.051 -.434 -.067 -.211 .597 .689#-.047 .725 .183 .147 .023 .231'; // fern fractal
  loadFractal(localStorage.lastFractal || initFract);
  computeInBackground();

  mainPane = new Tweakpane.Pane({container: document.getElementById("mainPaneDiv")});
  mainPane.addButton({title: 'Hide menu [M]'}).on('click', () => { toggleMainPane(); });
  mainPane.addButton({title: 'Load fractal [L]'}).on('click', () => { fractalSelector.show(); });
  mainPane.addButton({title: 'Save fractal [S]'}).on('click', saveFractal);
  mainPane.addButton({title: 'Download image [D]'}).on('click', downloadImage);
  //mainPane.addButton({title: 'Download movie [V]'}).on('click', downloadMovie);
  mainPane.addButton({title: 'Undo [Z]'}).on('click', () => { histor.back(); });
  mainPane.addButton({title: 'Redo [Y]'}).on('click', () => { histor.forward(); });
  mainPane.addButton({title: 'Add triangle [+]'}).on('click', addFormula);
  mainPane.addButton({title: 'Remove triangle [-]'}).on('click', () => { removeFormula(lastSelectedFormula); });
  mainPane.addInput(parameters, 'balanceFactor', { label: 'Total balance', min: .1, max: 3, step: .01 }).on('change', drawMainFractal);
  mainPane.addButton({title: 'Draw infinitely [I]'}).on('click', () => { viewFrac.infinite = !viewFrac.infinite; });
  mainPane.addButton({title: 'Edit colors [C]'}).on('click', toggleColorEditor);

  paletteEditor.colorPicker = mainPane.addInput(parameters, 'colorValue', { picker: 'inline', expanded: true }).on('change', () => { 
    let p = paletteKeys[lastSelectedColor];
    p.r = parameters.colorValue.r;
    p.g = parameters.colorValue.g;
    p.b = parameters.colorValue.b;
    fractalPalette = createPaletteFromKeys(paletteKeys);
    drawColorEditor();
    viewFrac.setForceRedrawPalette();
    drag.state = 'colorpicker';
  });
  paletteEditor.buttonAddColor = mainPane.addButton({title: 'Add color [A]'}).on('click', addColor);
  paletteEditor.buttonRemoveColor = mainPane.addButton({title: 'Remove color [X]'}).on('click', removeColor);
  paletteEditor.colorPicker.hidden = true;
  paletteEditor.buttonAddColor.hidden = true;
  paletteEditor.buttonRemoveColor.hidden = true;

  //userPane = new Tweakpane.Pane();
  //userPane.hidden = true;
  //mainPane.addInput(parameters, 'email');
  //mainPane.addInput(parameters, 'password');
  //mainPane.addInput(parameters, 'nickname');
  //mainPane.addButton({title: 'login'}).on('click', () => { sendXHR('action=login&email=' + parameters.email + '&password=' + parameters.password); });
  //mainPane.addButton({title: 'logout'}).on('click', () => { sendXHR('action=logout'); });
  //mainPane.addButton({title: 'register'}).on('click', () => { sendXHR('action=register&email=' + parameters.email + '&password=' + parameters.password + '&nickname=' + parameters.nickname); });
  //mainPane.addButton({title: 'reset password'}).on('click', () => { sendXHR('action=reset&email=' + parameters.email); });

  loadPane = new Tweakpane.Pane({container: document.getElementById("loadPaneDiv")});
  loadPane.addButton({title: 'Cancel [L]'}).on('click', () => { fractalSelector.hide(); });
  loadPane.addInput(parameters, 'tileSize', { label: 'Tile size', min: 50, max: 500, step: 1 }).on('change', () => { fractalSelector.update(); });
  loadPane.addInput(parameters, 'tileDetail', { label: 'Tile detail', min: 1, max: 10, step: 1 }).on('change', () => { fractalSelector.update(); });
}

window.onload = jsMain;
