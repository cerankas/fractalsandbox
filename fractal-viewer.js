// FractalViewer

class FractalViewer extends Viewport {
  constructor(ctx, zoom) {
    super(ctx, zoom);
    this.drawnPointsCount = 0;
    this.infinite = false;
    this.forceRedrawPalette = false;
    this.finishStatsShown = false;
    this.fractalString = '';
    this.fractalComputer = new FractalComputer();
  }
  prepare(fractal) {
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
    this.fractalComputer.initialize(this.fractal.formulas);
  }
  doCalculatePoints() {
    this.fractalComputer.compute(this.points);
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
    const palmul = (FRACTAL_PALETTE_LENGTH - 1) / this.tabmax;
    const thisTabLength = this.tab.length;
    for (let i = 0; i < thisTabLength; i++) {
      palData[i] = fractalPalette[(this.tab[i] * palmul) | 0];
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
        document.title = Math.floor(this.drawnPointsCount / 1000000) + ' mp ' + (getMilliseconds() - this.fractalComputer.startms) + ' ms';
        this.finishStatsShown = true;
      }
      return;
    }
    //document.title = ~~(100 * this.drawnPointsCount / this.maxpoints) + '%';
    this.doCalculatePoints();
    if (this.autoScaleRequired) {
      this.doAutoScale();
    }
    this.doSumPoints();
    this.doCalculateColors();
    this.doPutImageData();
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
