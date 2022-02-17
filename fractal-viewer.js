// FractalViewer

let doonce = 100;

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
    
    this.width  = this.ctx.canvas.width;
    this.height = this.ctx.canvas.height;
    
    this.sums = new Int32Array(this.width * this.height);
    // this.sums = new Float64Array(this.width * this.height);
    this.maxSum = 0;

    this.maxpoints = 100 * this.getArea();
    this.numpoints = 2 * this.getArea();

    if (this.points == undefined || this.points.length != 2 * this.numpoints) {
      this.points = new Float64Array(2 * this.numpoints); // two coordinates per point
    }
    
    if (this.imageData == undefined || this.imageData.width != this.width || this.imageData.height != this.height)
    this.imageData = this.ctx.createImageData(this.width, this.height);
    
    this.fractalComputer.initialize(this.formulas);
    
    this.lastPutImageTime = getMilliseconds();
    this.putImageInterval = 20;
  }
  
  processInBackground() {
    this.startms = getMilliseconds();
    this.startpt = this.calculatedPointsCount;
    if (this.isFinished()) return;
    if (!this.calculatedPointsCount) {
      this.doCalculatePoints();
      this.doAutoScale();
      this.doSumPoints();
      this.doCalculateColorsAndDraw();
    }
    else {
      while (getMilliseconds() - this.startms < Math.min(this.putImageInterval, 40)) {
        this.doCalculatePoints();
        this.doSumPoints();
      }
      if (getMilliseconds() - this.lastPutImageTime > this.putImageInterval || this.isFinished()) {
        this.lastPutImageTime = getMilliseconds();
        if (this.putImageInterval < 1000) this.putImageInterval *= 1.5;
        this.doCalculateColorsAndDraw();
      }
    }
    if (this.displayStats) this.doDisplayStats();
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
  
  doSumPoints0() {
    for (let i = 0; i < this.points.length; i += 2) {
      const x =  this.points[i    ] * this.scale + this.shift[0];
      const y = -this.points[i + 1] * this.scale + this.shift[1];
      if (x > 0 && x <= this.width && y > 0 && y <= this.height) {
        const xx = x | 0;
        const yy = y | 0;
        const wx1 = x - xx;
        const wy1 = y - yy;
        const wx2 = xx + 1 - x;
        const wy2 = yy + 1 - y;
        if (doonce) {
          console.log(wx1 * wy1 + wx1 * wy2 + wx2 * wy1 + wx2 * wy2)
          doonce --;
        }
        const j = (xx - 1) + this.width * (yy - 1);
        this.sums[j                 ] +=  wx1 * wy1;
        this.sums[j              + 1] +=  wx2 * wy1;
        this.sums[j + this.width    ] +=  wx1 * wy2;
        this.sums[j + this.width + 1] +=  wx2 * wy2;
      }
    }
  }

  doSumPoints() {
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
    for (let i = this.sums.length - 1; i >= 0; i--) {
      if (this.maxSum < this.sums[i]) {
        this.maxSum = this.sums[i];
      }
    }
    const palData = new Int32Array(this.imageData.data.buffer);
    const palmul = (PaletteKey.PALETTE_LENGTH - 1) / this.maxSum;
    for (let i = this.sums.length - 1; i >= 0; i--) {
      palData[i] = this.palette[(this.sums[i] * palmul) | 0];
    }
    this.ctx.putImageData(this.imageData, 0, 0);
    //this.doDrawHistogram();
  }

  doDrawHistogram() {
    const size = this.width;
    const hist = new Array(size).fill(0);
    // var mul = (size - 1) / this.maxSum;
    // var mul = (size - 1) / Math.sqrt(this.maxSum);
    // var mul = (size - 1) / Math.log2(this.maxSum);
    var mul = (size - 1) / Math.pow(this.maxSum, .3);
    for (let i = 0; i < this.sums.length; i++) {
      // hist[(this.sums[i] * mul) | 0] ++;
      // hist[Math.sqrt(this.sums[i] * mul) | 0] ++;
      // hist[(Math.log2(this.sums[i]) * mul) | 0] ++;
      hist[(Math.pow(this.sums[i], .3) * mul) | 0] ++;
    }

    let max = 0;
    for (let i = 1; i < hist.length; i++)
      if (max < hist[i]) max = hist[i];
    let ctx = this.ctx;
    ctx.strokeStyle = 'red';
    ctx.fillsStyle = 'grey';
    ctx.beginPath();
    ctx.moveTo(0, this.height * .9);
    for (var i = 1; i < hist.length; i++) {
      ctx.lineTo(i, this.height * .9 - (hist[i] * this.height * .3) / max);
    }
    ctx.stroke();
  }
  
  doDisplayStats() {
    if (this.isFinished()) document.title = 
    Math.floor(this.calculatedPointsCount / 1000000) + ' mp ' + 
    (getMilliseconds() - this.fractalComputer.startms) + ' ms';
    else document.title = 
    Math.floor((this.calculatedPointsCount - this.startpt) / (getMilliseconds() - this.startms)) + ' : ' + 
    ~~(100 * this.calculatedPointsCount / this.maxpoints) + '% ';
  }
  
  getArea() {
    return this.width * this.height;
  }
  
}
