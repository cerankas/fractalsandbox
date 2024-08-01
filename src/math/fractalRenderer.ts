import Formula from "./formula";
import { createPaletteFromKeys, paletteKeysFromString, PALETTE_LENGTH } from "./palette";
import FractalSummator from "./fractalSummator";
import { getMs } from "./util";
import BackgroundScheduler from "~/logic/scheduler";
import ImageCache from "~/logic/imageCache";

export default class FractalRenderer extends FractalSummator {
  static scheduler = new BackgroundScheduler();
  static imageCache = new ImageCache;

  ctx: CanvasRenderingContext2D | null = null;
  imageData: ImageData | null = null;
  sums = new Int32Array();

  pointsPerImage = 0;
  
  lastStageTime = 0;
  stageInterval = 0;
  
  renderInfinitely = false;
  palette: number[] = [];

  fractal = "";
  color = "";

  mustRecalc = false;
  mustRedraw = false;

  constructor(private cached = false, private basePriority = 0, private onprogress?: (progress: number) => void) {
    super(.9);
  }

  setCtx = (ctx: CanvasRenderingContext2D) => {
    if (this.width != ctx.canvas.width || this.height != ctx.canvas.height) {
      super.setSize([ctx.canvas.width, ctx.canvas.height]);
      this.mustRecalc = true;
    }
    this.ctx = ctx;
    this.render();
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

    this.releaseTask();

    this.mustRecalc = false;
    super.prepare();
    
    this.sums = new Int32Array(this.width * this.height);
    this.imageData = this.ctx.createImageData(this.width, this.height);
    this.maxSum = 0;

    this.pointsPerImage = this.densityPerImage * this.area;
    this.pointsCount = 0;

    if (this.cached && FractalRenderer.imageCache.isStored(this.fractal, this.width, this.height)) 
      void this.prepareCached();
    else 
      this.prepareCalculated();
  }

  async prepareCached() {
    const initWidth = this.width;
    const initHeight = this.height;
    const w9 = this.width * .9 | 0;
    const h9 = this.height * .9 | 0;
    await FractalRenderer.imageCache.fetch(this.fractal, w9, h9)
    .then(
      (result) => {
        const offsetX = (this.width - result.width) / 2 | 0;
        const offsetY = (this.height - result.height) / 2 | 0;
        if (this.width !== initWidth || this.height !== initHeight) { /* console.warn('Dimensions changed before fetch', [this.width, this.height], [initWidth, initHeight]); */ return; }
        // if (w9 !== result.width && h9 !== result.height) throw Error('Both x and y different from fetched image');
        // if (w9 < result.width || h9 < result.height) throw Error('Fetched image is bigger than requested');
        for (let y = 0; y < result.height; y++) {
          const start = y * result.width;
          const offset = offsetX + (offsetY + y) * this.width;
          this.sums.set(result.data.subarray(start, start + result.width), offset);
        }
        this.pointsCount = this.pointsPerImage;
        this.draw();
        this.onprogress?.(1);
      },
      () => this.prepareCalculated()
    );   
  }

  storeInCache() {
    let width = this.width * .9 | 0;
    let height = this.height * .9 | 0;
    let offsetX = (this.width - width) / 2 | 0;
    let offsetY = (this.height - height) / 2 | 0;
    const rowIsEmpty = (y: number) => {
      for (let x = 0; x < width; x++) if (this.sums[offsetX + x + y * this.width] !== 0) return false;
      return true;
    }
    const colIsEmpty = (x: number) => {
      for (let y = 0; y < height; y++) if (this.sums[x + (offsetY + y) * this.width] !== 0) return false;
      return true;
    }
    while (rowIsEmpty(offsetY) && rowIsEmpty(offsetY + height - 1)) { offsetY += 1; height -= 2; }
    while (colIsEmpty(offsetX) && colIsEmpty(offsetX + width  - 1)) { offsetX += 1; width  -= 2; }
    const data = new Int32Array(width * height);
    for (let y = 0; y < height; y++){
      const start = offsetX + (offsetY + y) * this.width;
      data.set(this.sums.subarray(start, start + width), y * width);
    }
    FractalRenderer.imageCache.store(this.fractal, width, height, data);
  }

  prepareCalculated() {
    this.lastStageTime = getMs();
    this.stageInterval = 20;
    
    FractalRenderer.scheduler.addTask(this);
  }

  releaseTask() {
    FractalRenderer.scheduler.removeTask(this);
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
    if (this.isFinished() && this.cached) this.storeInCache();
    this.onprogress?.(this.pointsCount / this.pointsPerImage);
  }
  
  priority() { return this.basePriority + this.pointsCount / this.pointsPerImage; }
  
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
