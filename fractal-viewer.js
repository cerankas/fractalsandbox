// FractalViewer

class FractalViewer extends Viewport {

  constructor(ctx, zoom) {
    super(ctx, zoom);
    this.calculatedPointsCount = 0;
    this.infinite = false;
    this.fractalComputer = new FractalComputer();
    this.displayStats = false;
  }

  registerEventListeners() {
    this.registerWheelListener();    
    this.ctx.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
    return this;
  }

  onPointerDown(e) {
    if (e.button == 0) {
      globalDrag.startDrag(this);
      this.dragStart = this.manualShift.sub(getEventOffsetXY(e));
    }
    if (e.button == 2) {
      this.resetToAuto();
      this.viewChanged = true;
    }
  }

  onDrag(mousePoint) {
    this.manualShift = this.dragStart.add(mousePoint);
    this.updateTransform();
    this.viewChanged = true;
  }

  setFormulas(formulas) {
    this.formulas = formulas;
    this.prepare();
  }

  setPalette(palette) {
    this.palette = palette;
    if (this.calculatedPointsCount) {
      this.doCalculateColorsAndDraw();
    }
  }

  prepare() {
    this.calculatedPointsCount = 0;
    this.maxSum = 0;
    this.width  = this.ctx.canvas.width;
    this.height = this.ctx.canvas.height;
    this.sums = new Int32Array(this.width * this.height);
    this.maxpoints = 100 * this.getArea(this);
    this.numpoints = 2 * this.getArea(this);
    if (this.points == undefined || this.points.length != 2 * this.numpoints)
      this.points = new Float64Array(2 * this.numpoints); // two coordinates per point
    if (this.imageData == undefined || this.imageData.width != this.width || this.imageData.height != this.height)
      this.imageData = this.ctx.createImageData(this.width, this.height);
    this.fractalComputer.initialize(this.formulas);
    this.lastPutImageTime = getMilliseconds();
    this.putImageInterval = 20;
  }

  processInBackground() {
    let startms = getMilliseconds();
    if (this.isFinished()) return;
    if (!this.calculatedPointsCount) {
      this.doCalculatePoints();
      this.doAutoScale();
      this.doSumPoints();
      this.doCalculateColorsAndDraw();
    }
    else {
      while (getMilliseconds() - startms < Math.min(this.putImageInterval, 40)) {
        this.doCalculatePoints();
        this.doSumPoints();
      }
      if (getMilliseconds() - this.lastPutImageTime > this.putImageInterval || this.isFinished()) {
        this.lastPutImageTime = getMilliseconds();
        if (this.putImageInterval < 2000) this.putImageInterval *= 1.5;
        this.doCalculateColorsAndDraw();
      }
    }
    if (this.displayStats) {
      if (this.isFinished()) document.title = 
        Math.floor(this.calculatedPointsCount / 1000000) + ' mp ' + 
        (getMilliseconds() - this.fractalComputer.startms) + ' ms';
      else document.title = 
        Math.floor((this.numpoints) / (getMilliseconds() - startms)) + ' : ' + 
        ~~(100 * this.calculatedPointsCount / this.maxpoints) + '% ';
    }
  }

  isFinished() {
    return this.calculatedPointsCount >= this.maxpoints && !this.infinite;
  }

  doCalculatePoints() {
    this.calculatedPointsCount += this.numpoints;
    this.fractalComputer.compute(this.points);
  }

  doAutoScale() {
    const minMax = getBoundingBoxFrom1DArray(this.points);
    this.setMinMax(minMax);
  }

  doSumPoints() {
    const thisPointsLength = this.points.length;
    const scale = this.scale;
    const shiftx = this.shift[0];
    const shifty = this.shift[1];
    for (let i = 0; i < thisPointsLength; i += 2) {
      const x = ( this.points[i    ] * scale + shiftx) | 0;
      const y = (-this.points[i + 1] * scale + shifty) | 0;
      if (x > 0 && x <= this.width && y > 0 && y <= this.height) {
        const j = x - 1 + this.width * (y - 1);
        if (++this.sums[j] > this.maxSum)
          this.maxSum = this.sums[j];
      }
    }
  }

  doSumPoints2() {
    for (let i = 0; i < this.points.length; i += 2) {
      const x = ( this.points[i    ] * this.scale + this.shift[0]) | 0;
      const y = (-this.points[i + 1] * this.scale + this.shift[1]) | 0;
      if (x > 0 && x <= this.width && y > 0 && y <= this.height) {
        const j = x - 1 + this.width * (y - 1);
        if (++this.sums[j] > this.maxSum)
          this.maxSum = this.sums[j];
      }
    }
  }

  doCalculateColorsAndDraw() {
    const palData = new Int32Array(this.imageData.data.buffer);
    const palmul = (FRACTAL_PALETTE_LENGTH - 1) / this.maxSum;
    const thisTabLength = this.sums.length;
    for (let i = 0; i < thisTabLength; i++) {
      palData[i] = this.palette[(this.sums[i] * palmul) | 0];
    }
    this.ctx.putImageData(this.imageData, 0, 0);
  }

  getArea() {
    return this.width * this.height;
  }

}
