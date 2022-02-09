// FractalViewer

class FractalViewer extends Viewport {

  constructor(ctx, zoom) {
    super(ctx, zoom);
    this.calculatedPointsCount = 0;
    this.infinite = false;
    this.forceRedrawPalette = false;
    this.finishStatsShown = false;
    this.fractalString = '';
    this.dragStart = [0, 0];
    this.fractalComputer = new FractalComputer();
  }

  registerEventListeners() {
    this.registerWheelListener();    
    this.ctx.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
    return this;
  }

  onPointerDown(e) {
    if (e.button == 0) {
      GlobalDrag.startDrag(this);
      this.dragStart = this.manualShift.sub(getEventClientXY(e));
    }
    if (e.button == 2) {
      this.resetManual();
      drawMainFractal();
    }
  }
  
  onDrag(mousePoint) {
    this.manualShift = this.dragStart.add(mousePoint);
    drawMainFractal();
  }
  
  prepare(formulas) {
    this.calculatedPointsCount = 0;
    this.tabmax = 0;
    this.width  = this.ctx.canvas.width;
    this.height = this.ctx.canvas.height;
    this.tab = new Int32Array(this.width * this.height);
    this.maxpoints = 100 * getViewArea(this);
    this.numpoints = 1 * getViewArea(this);
    if (this.points == undefined || this.points.length != 2 * this.numpoints)
      this.points = new Float64Array(2 * this.numpoints); // two coordinates per point
    if (this.imageData == undefined || this.imageData.width != this.width || this.imageData.height != this.height)
      this.imageData = this.ctx.createImageData(this.width, this.height);
    this.autoScaleRequired = true;
    this.finishStatsShown = false;
    if (formulas) {
      this.formulas = formulas;
      this.fractalString = this.formulas.toString();
    }
    this.fractalComputer.initialize(this.formulas);
    this.lastPutImageTime = getMilliseconds();
    this.putImageInterval = 20;
  }

  draw() {
    let startms = getMilliseconds();
    if (this.isFinished()) {
      if (this.forceRedrawPalette) {
        this.redrawPalette();
      }
      if (!this.finishStatsShown) {
        document.title = Math.floor(this.calculatedPointsCount / 1000000) + ' mp ' + (getMilliseconds() - this.fractalComputer.startms) + ' ms';
        this.finishStatsShown = true;
      }
      return;
    }
    //document.title = ~~(100 * this.calculatedPointsCount / this.maxpoints) + '%';
    if (this.autoScaleRequired) {
      this.doCalculatePoints();
      this.doAutoScale();
      this.doSumPoints();
      //while (getMilliseconds() - startms < 8) {
      //  this.doCalculatePoints();
      //  this.doSumPoints();
     // }
      this.doCalculateColors();
      this.doPutImageData();
    }
    else {
      while (getMilliseconds() - startms < Math.min(this.putImageInterval, 40)) {
        this.doCalculatePoints();
        this.doSumPoints();
      }
      if (getMilliseconds() - this.lastPutImageTime > this.putImageInterval || this.isFinished()) {
        this.lastPutImageTime = getMilliseconds();
        if (this.putImageInterval < 2000) this.putImageInterval *= 1.5;
        this.doCalculateColors();
        this.doPutImageData();
      }
    }
    document.title = Math.floor((this.numpoints) / (getMilliseconds() - startms));
  }

  isFinished() {
    return this.calculatedPointsCount >= this.maxpoints && !this.infinite;
  }

  doCalculatePoints() {
    this.calculatedPointsCount += this.numpoints;
    this.fractalComputer.compute(this.points);
  }

  doAutoScale() {
    this.autoScaleRequired = false;
    const minMax = getBoundingBoxFrom1DArray(this.points);
    this.setMinMax(minMax);
  }

  doSumPoints() {
    const thisPointsLength = this.points.length;
    const shiftx = this.shift[0];
    const shifty = this.shift[1];
    for (let i = 0; i < thisPointsLength; i += 2) {
      const x = ( this.points[i    ] * this.scale + shiftx) | 0;
      const y = (-this.points[i + 1] * this.scale + shifty) | 0;
      if (x > 0 && x <= this.width && y > 0 && y <= this.height) {
        const j = x - 1 + this.width * (y - 1);
        if (++this.tab[j] > this.tabmax)
          this.tabmax = this.tab[j];
      }
    }
  }

  doCalculateColors() {
    const palData = new Int32Array(this.imageData.data.buffer);
    const palmul = (FRACTAL_PALETTE_LENGTH - 1) / this.tabmax;
    const thisTabLength = this.tab.length;
    const palette = globalPaletteEditor.palette;
    for (let i = 0; i < thisTabLength; i++) {
      palData[i] = palette[(this.tab[i] * palmul) | 0];
    }
  }

  doPutImageData() {
    this.ctx.putImageData(this.imageData, 0, 0);
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
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  for (let i = 0; i < points.length; i++) {
    const x = points[i][0], y = points[i][1];
    if (x < minx) minx = x; if (x > maxx) maxx = x;
    if (y < miny) miny = y; if (y > maxy) maxy = y;
  }
  return [[minx, miny], [maxx, maxy]];
}

function getBoundingBoxFrom1DArray(points) {
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  for (let i = 0; i < points.length - 1000; i += 2) {
    const x = points[i], y = points[i + 1];
    if (x < minx) minx = x; if (x > maxx) maxx = x;
    if (y < miny) miny = y; if (y > maxy) maxy = y;
  }
  return [[minx, miny], [maxx, maxy]];
}
