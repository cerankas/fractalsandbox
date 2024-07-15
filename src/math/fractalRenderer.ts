import Formula from "./formula";
import { createPaletteFromKeys, paletteKeysFromString, PALETTE_LENGTH } from "./palette";
import FractalSummator from "./fractalSummator";
import { getMs } from "./util";
import BackgroundScheduler from "~/logic/scheduler";
import IndexedDBManager from "~/logic/cache";

export default class FractalRenderer extends FractalSummator {
  static scheduler = new BackgroundScheduler();
  static sumsCache = new IndexedDBManager("SumsCache", 1);

  ctx: CanvasRenderingContext2D | null = null;
  imageData: ImageData | null = null;
  sums = new Int32Array();

  pointsPerImage = 0;
  
  lastStageTime = 0;
  stageInterval = 0;
  
  renderInfinitely = false;
  palette: number[] = [];

  formString = "";
  cacheKey = "";
  cached = false;

  fractal = "";
  color = "";

  mustRecalc = false;
  mustRedraw = false;

  constructor(private onprogress?: (progress: number) => void) {
    super(.9);
  }

  setCtx(ctx: CanvasRenderingContext2D) {
    if (this.width != ctx.canvas.width || this.height != ctx.canvas.height) {
      super.setSize([ctx.canvas.width, ctx.canvas.height]);
      this.mustRecalc = true;
    }
    this.ctx = ctx;
  }

  setCached(cached: boolean) {
    this.cached = cached;
  }

  setForm(form: string) {
    if (this.fractal === form) return;
    this.fractal = form;
    this.formulas = Formula.fromString(form);
    this.mustRecalc = true;
  }

  setColor(color: string) {
    if (this.color === color) return;
    this.color = color;
    this.palette = createPaletteFromKeys(paletteKeysFromString(color));
    this.mustRedraw = true;
  }

  render() {
    if (!this.ctx) return;
    if (!this.area) return;
    if (!this.formulas.length) return;

    if (!this.mustRecalc) {
      if (this.mustRedraw) {
        this.draw();
      }
      return;
    }

    this.mustRecalc = false;
    super.prepare();
    
    this.sums = new Int32Array(this.width * this.height);
    this.imageData = this.ctx.createImageData(this.width, this.height);
    this.maxSum = 0;

    this.pointsPerImage = this.densityPerImage * this.area;
    this.pointsCount = 0;

    if (this.cached) 
      void this.prepareCached();
    else 
      this.prepareCalculated();
  }

  async prepareCached() {
    this.cacheKey = `${this.width}x${this.height}:${this.fractal}`;
    try {
      this.sums = await FractalRenderer.sumsCache.fetch(this.cacheKey);
      this.pointsCount = this.pointsPerImage;
      this.draw();
      this.onprogress?.(1);
    }
    catch (e) {
      this.prepareCalculated();
    }   
  }

  prepareCalculated() {
    this.lastStageTime = getMs();
    this.stageInterval = 20;
    
    FractalRenderer.scheduler.addTask(this);
  }
  
  process() {
    if (this.isFinished()) return;
    const startMs = getMs();
    if (!this.pointsCount) {
      super.process(this.sums, true);
      this.draw();
    }
    else {
      while (getMs() - startMs < Math.min(this.stageInterval, 40) && !this.isFinished()) {
        super.process(this.sums);
      }
      if (getMs() - this.lastStageTime > this.stageInterval || this.isFinished()) {
        this.lastStageTime = getMs();
        if (this.stageInterval < 1000) this.stageInterval *= 1.5;
        this.draw();
      }
    }
    if (this.isFinished() && this.cached) {
      void FractalRenderer.sumsCache.store(this.cacheKey, this.sums);
    }
    this.onprogress?.(this.pointsCount / this.pointsPerImage);
  }
  
  isPrepared() { return this.pointsCount != 0 || this.pointsPerImage == 0; }
  
  isFinished() { return this.pointsCount >= this.pointsPerImage && !this.renderInfinitely; }
  
  draw = () => {
    if (!this.ctx || !this.imageData) return;
    for (const sum of this.sums) {
      if (this.maxSum < sum) {
        this.maxSum = sum;
      }
    }
    const palData = new Int32Array(this.imageData.data.buffer);
    const palmul = (PALETTE_LENGTH - 1) / this.maxSum;
    for (let i = this.sums.length - 1; i >= 0; i--) {
      palData[i] = this.palette[(this.sums[i]! * palmul) | 0]!;
    }
    this.ctx.putImageData(this.imageData, 0, 0);
    this.mustRedraw = false;
  }

}
