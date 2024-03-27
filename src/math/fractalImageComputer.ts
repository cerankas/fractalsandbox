import type Formula from "./formula";
import PaletteKey from "./palette";
import FractalSumsComputer from "./fractalSumsComputer";
import { getMs } from "./util";

export default class FractalImageComputer extends FractalSumsComputer {
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

  constructor(public ctx: CanvasRenderingContext2D, zoom: number) {
    super(zoom);
    this.imageData = ctx.createImageData(1,1);
  }

  setFormulas(formulas: Formula[]) {
    super.setFormulas(formulas);
    this.prepare();
  }

  setPalette(palette: number[]) {
    this.palette = palette;
    if (this.calculatedPointsCount) {
      this.doCalculateColorsAndDraw();
    }
  }

  prepare() {
    if (!this.formulas.length) return;
    super.prepare();
    
    this.width  = this.ctx.canvas.width;
    this.height = this.ctx.canvas.height;
    
    this.sums = new Int32Array(this.width * this.height);
    this.maxSum = 0;

    this.numPointsPerCall  = this.densityPerCall  * this.area;
    this.numPointsPerImage = this.densityPerImage * this.area;

    this.imageData = this.ctx.createImageData(this.width, this.height);
    
    this.lastPutImageTime = getMs();
    this.putImageInterval = 20;
  }
  
  processInBackground() {
    this.startMs = getMs();
    this.startPts = this.calculatedPointsCount;
    if (this.isFinished()) return;
    if (!this.calculatedPointsCount) {
      super.compute(this.sums, true)
      this.doCalculateColorsAndDraw();
    }
    else {
      while (getMs() - this.startMs < Math.min(this.putImageInterval, 40) && !this.isFinished()) {
        super.compute(this.sums);
      }
      if (getMs() - this.lastPutImageTime > this.putImageInterval || this.isFinished()) {
        this.lastPutImageTime = getMs();
        if (this.putImageInterval < 1000) this.putImageInterval *= 1.5;
        this.doCalculateColorsAndDraw();
      }
    }
  }
  
  isFinished() {
    return this.calculatedPointsCount >= this.numPointsPerImage && !this.infinite;
  }
  
  doCalculateColorsAndDraw() {
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
  }

}
