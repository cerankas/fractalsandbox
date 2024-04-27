import type Formula from "./formula";
import PaletteKey from "./palette";
import FractalSumsComputer from "./fractalSumsComputer";
import { getMs } from "./util";
import BackgroundScheduler from "~/logic/scheduler";
import IndexedDBManager from "~/logic/cache";

export default class FractalImageComputer extends FractalSumsComputer {
  static scheduler = new BackgroundScheduler();
  static sumsCache = new IndexedDBManager("SumsCache", 1);

  sums = new Int32Array();
  imageData: ImageData;

  numPointsPerCall = 0;
  numPointsPerImage = 0;
  
  lastPutImageTime = 0;
  putImageInterval = 0;
  
  startMs = 0;
  startPts = 0;
  
  infinite = false;
  palette: number[] = [];

  formString = "";
  cacheKey = "";
  cached = false;

  constructor(public ctx: CanvasRenderingContext2D, zoom: number) {
    super(zoom);
    this.imageData = ctx.createImageData(1,1);
    FractalImageComputer.scheduler.addTask(this);
  }

  setCached(cached: boolean) {
    this.cached = cached;
  }

  setFormulas(formulas: Formula[]) {
    super.setFormulas(formulas);
    this.formString = this.formulas.toString();
    this.prepare();
  }

  setPalette(palette: number[]) {
    this.palette = palette;
    if (this.calculatedPointsCount) {
      this.draw();
    }
  }

  prepare() {
    if (!this.formulas.length) return;
    super.prepare();
    
    this.screenWidth  = this.ctx.canvas.width;
    this.screenHeight = this.ctx.canvas.height;
    
    this.sums = new Int32Array(this.screenWidth * this.screenHeight);
    this.imageData = this.ctx.createImageData(this.screenWidth, this.screenHeight);
    this.maxSum = 0;

    if (this.cached) 
      void this.prepareCached();
    else 
      this.prepareCalculated();
  }

  async prepareCached() {
    this.cacheKey = `${this.screenWidth}x${this.screenHeight}:${this.formulas.toString()}`;
    try {
      this.sums = await FractalImageComputer.sumsCache.fetch(this.cacheKey);
      this.calculatedPointsCount = this.numPointsPerImage;
      this.draw();
    }
    catch (e) {
      this.prepareCalculated();
    }   
  }

  prepareCalculated() {
    this.numPointsPerCall  = this.densityPerCall  * this.area;
    this.numPointsPerImage = this.densityPerImage * this.area;

    this.lastPutImageTime = getMs();
    this.putImageInterval = 20;
    
    FractalImageComputer.scheduler.run();
  }
  
  process() {
    this.startMs = getMs();
    this.startPts = this.calculatedPointsCount;
    if (this.isFinished()) return;
    if (!this.calculatedPointsCount) {
      super.compute(this.sums, true)
      this.draw();
    }
    else {
      while (getMs() - this.startMs < Math.min(this.putImageInterval, 40) && !this.isFinished()) {
        super.compute(this.sums);
      }
      if (getMs() - this.lastPutImageTime > this.putImageInterval || this.isFinished()) {
        this.lastPutImageTime = getMs();
        if (this.putImageInterval < 1000) this.putImageInterval *= 1.5;
        this.draw();
      }
    }
    if (this.isFinished() && this.cached) {
      void FractalImageComputer.sumsCache.store(this.cacheKey, this.sums);
    }
  }
  
  isPrepared() {
    return this.calculatedPointsCount != 0;
  }
  
  isFinished() {
    return this.calculatedPointsCount >= this.numPointsPerImage && !this.infinite;
  }
  
  draw = () => {
    for (const sum of this.sums) {
      if (this.maxSum < sum) {
        this.maxSum = sum;
      }
    }
    const palData = new Int32Array(this.imageData.data.buffer);
    const palmul = (PaletteKey.PALETTE_LENGTH - 1) / this.maxSum;
    for (let i = this.sums.length - 1; i >= 0; i--) {
      palData[i] = this.palette[(this.sums[i]! * palmul) | 0]!;
    }
    this.ctx.putImageData(this.imageData, 0, 0);
    if (!this.isFinished()) this.drawProgressBar();
  }

  drawProgressBar() {
    this.ctx.strokeStyle = "black";
    this.ctx.beginPath();
    this.ctx.moveTo(this.screenWidth * this.calculatedPointsCount / this.numPointsPerImage, this.screenHeight);
    this.ctx.lineTo(this.screenWidth, this.screenHeight);
    this.ctx.stroke();
  }

}
