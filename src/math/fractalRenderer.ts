import Formula from "./formula";
import { createPaletteFromKeys, paletteKeysFromString, PALETTE_LENGTH } from "./palette";
import FractalSummator from "./fractalSummator";
import { getMs } from "./util";
import BackgroundScheduler from "~/logic/scheduler";
import ImageCache from "~/logic/imageCache";

const frameReductionFactor = .9;
export const reduceByFrame = (dimension: number) => dimension * frameReductionFactor | 0;
const frameOffset = (dimension: number, reduced? : number) => (dimension - (reduced ?? reduceByFrame(dimension))) / 2 | 0;

type FractalRendererProps = {
  initPriority: number;
  drawPriority: number;
  cached?: boolean;
  onprogress?: ((progress: number) => void) | undefined;
};

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

  initPriority;
  drawPriority;
  cached;
  onprogress;

  constructor({initPriority, drawPriority, cached = false, onprogress = undefined} : FractalRendererProps) {
    super(frameReductionFactor);
    this.initPriority = initPriority;
    this.drawPriority = drawPriority;
    this.cached = cached;
    this.onprogress = onprogress;
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

    void this.prepare();
  }

  async prepare() {
    if (this.cached && await FractalRenderer.imageCache.cachedSize(this.fractal, this.width, this.height) !== undefined) 
      await this.prepareCached();
    else 
      setTimeout(this.prepareCalculated);
  }

  async prepareCached() {
    const initWidth = this.width;
    const initHeight = this.height;
    await FractalRenderer.imageCache.get(this.fractal, this.width, this.height)
    .then(
      (result) => {
        if (this.width !== initWidth || this.height !== initHeight) return; // Dimensions changed before fetch
        const offsetX = frameOffset(this.width, result.width);
        const offsetY = frameOffset(this.height, result.height);
        for (let y = 0; y < result.height; y++) {
          const start = y * result.width;
          const offset = offsetX + (offsetY + y) * this.width;
          this.sums.set(result.data.subarray(start, start + result.width), offset);
        }
        this.pointsCount = this.pointsPerImage;
        this.draw();
        this.onprogress?.(1);
      },
      () => setTimeout(this.prepareCalculated)
    );   
  }

  storeInCache() {
    let framedWidth = reduceByFrame(this.width);
    let framedHeight = reduceByFrame(this.height);
    let offsetX = frameOffset(this.width);
    let offsetY = frameOffset(this.height);
    const rowIsEmpty = (y: number) => {
      for (let x = 0; x < framedWidth; x++) if (this.sums[offsetX + x + y * this.width] !== 0) return false;
      return true;
    }
    const colIsEmpty = (x: number) => {
      for (let y = 0; y < framedHeight; y++) if (this.sums[x + (offsetY + y) * this.width] !== 0) return false;
      return true;
    }
    while (rowIsEmpty(offsetY) && rowIsEmpty(offsetY + framedHeight - 1)) { offsetY += 1; framedHeight -= 2; }
    while (colIsEmpty(offsetX) && colIsEmpty(offsetX + framedWidth  - 1)) { offsetX += 1; framedWidth  -= 2; }
    const data = new Int32Array(framedWidth * framedHeight);
    for (let y = 0; y < framedHeight; y++){
      const start = offsetX + (offsetY + y) * this.width;
      data.set(this.sums.subarray(start, start + framedWidth), y * framedWidth);
    }
    FractalRenderer.imageCache.put(this.fractal, framedWidth, framedHeight, data);
  }

  prepareCalculated = () => {
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
  
  priority() { return !this.pointsCount ? this.initPriority : this.drawPriority + this.pointsCount / this.pointsPerImage; }
  
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
