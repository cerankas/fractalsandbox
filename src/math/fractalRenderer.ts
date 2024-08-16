import Formula from "./formula";
import { createPaletteFromKeys, paletteKeysFromString, PALETTE_LENGTH } from "./palette";
import FractalSummator from "./fractalSummator";
import { getMs } from "./util";
import BackgroundScheduler from "~/logic/scheduler";
import ImageCache from "~/logic/imageCache";
import { providedFractalRanges } from "~/logic/fractalProvider";

const defaultZoom = .9;
const frameOffset = (dimension: number, framedDimension : number) => (dimension - framedDimension) / 2 | 0;

type FractalRendererProps = {
  initPriority: number;
  drawPriority: number;
  cached?: boolean;
  onprogress?: ((progress: number) => void) | undefined;
};

export default class FractalRenderer extends FractalSummator {
  static scheduler = new BackgroundScheduler();
  static imageCache = new ImageCache();

  ctx: CanvasRenderingContext2D | null = null;
  imageData: ImageData | null = null;
  sums = new Int32Array();

  pointsPerImage = 0;
  
  lastStageTime = 0;
  stageInterval = 0;
  
  renderInfinitely = false;
  palette: number[] = [];

  form = "";
  color = "";

  mustRecalc = false;
  mustRedraw = false;
  
  zoomedWidth = 0;
  zoomedHeight = 0;

  formInRendering = '';
  frameFromCache: ReturnType<FractalRenderer['getFrameToStore']> | null = null;
  renderTime = 0;

  initPriority;
  drawPriority;
  cached;
  onprogress;

  constructor({initPriority, drawPriority, cached = false, onprogress = undefined} : FractalRendererProps) {
    super(defaultZoom);
    this.initPriority = initPriority;
    this.drawPriority = drawPriority;
    this.cached = cached;
    this.onprogress = onprogress;
  }

  setZoomedSize() {
    const reduceByFrame = (dimension: number) => dimension * defaultZoom | 0;
    this.zoomedWidth = reduceByFrame(this.width);
    this.zoomedHeight = reduceByFrame(this.height);
  }

  setCtx = (ctx: CanvasRenderingContext2D) => {
    if (this.width != ctx.canvas.width || this.height != ctx.canvas.height) {
      super.setSize([ctx.canvas.width, ctx.canvas.height]);
      this.setZoomedSize();
      this.mustRecalc = true;
    }
    this.ctx = ctx;
    this.render();
  }

  setForm(form: string) {
    if (this.form === form) return;
    this.form = form;
    this.formulas = Formula.fromString(form);
    this.mustRecalc = true;
  }

  setColor(color: string) {
    if (this.color === color) return;
    this.color = color;
    this.palette = createPaletteFromKeys(paletteKeysFromString(color));
    this.mustRedraw = true;
  }

  shouldCacheProgress() {
    if (!this.cached || !this.pointsCount || this.renderTime < 200 || this.isFinished()) return false;
    if (providedFractalRanges[0]?.find(fractal => fractal.form === this.formInRendering) !== undefined) return true;
    return false;
  }

  render() {
    if (!this.ctx) return;
    if (!this.area) return;
    if (!this.formulas.length) return;

    if (!this.mustRecalc && this.mustRedraw) this.draw();
    if (!this.mustRecalc) return;

    this.releaseTask();

    if (this.shouldCacheProgress()) this.storeInCache();
    this.formInRendering = this.form;
    this.frameFromCache = null;
    this.renderTime = 0;

    this.mustRecalc = false;
    super.prepare();
    
    this.sums = new Int32Array(this.width * this.height);
    this.imageData = this.ctx.createImageData(this.width, this.height);
    this.maxSum = 0;

    this.pointsPerImage = this.densityPerImage * this.area;
    this.pointsCount = 0;

    void this.prepareRender();
  }

  async prepareRender() {
    if (this.cached && await FractalRenderer.imageCache.cachedSize(this.form, this.zoomedWidth, this.zoomedHeight) !== undefined) 
      await this.prepareCached();
    else 
      setTimeout(this.prepareCalculated);
  }

  async prepareCached() {
    const initWidth = this.width;
    const initHeight = this.height;

    await FractalRenderer.imageCache.get(this.form, this.zoomedWidth, this.zoomedHeight)
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
        
        const resumeData = JSON.parse(result.resumeData) as ReturnType<FractalRenderer['getResumeData']>;
        
        this.pointsCount = resumeData.pointsCount;
        this.frameFromCache = { width: result.width, height: result.height, offsetX, offsetY };
        
        if (this.pointsCount >= this.pointsPerImage) {
          this.draw();
          this.onprogress?.(1);
        } else {
          this.dataMin = resumeData.dataMin;
          this.dataMax = resumeData.dataMax;
          this.updateTransform();
          this.pointsComputer.x = resumeData.x;
          this.pointsComputer.y = resumeData.y;
          this.prepareCalculated();
  
        }
      },
      () => setTimeout(this.prepareCalculated)
    );   
  }

  getFrameToStore() {
    const frame = {
      width: this.zoomedWidth,
      height: this.zoomedHeight,
      offsetX: frameOffset(this.width, this.zoomedWidth),
      offsetY: frameOffset(this.height, this.zoomedHeight),
    }
    const rowIsEmpty = (y: number) => {
      for (let x = 0; x < frame.width; x++) if (this.sums[frame.offsetX + x + y * this.width] !== 0) return false;
      return true;
    }
    const colIsEmpty = (x: number) => {
      for (let y = 0; y < frame.height; y++) if (this.sums[x + (frame.offsetY + y) * this.width] !== 0) return false;
      return true;
    }
    while (rowIsEmpty(frame.offsetY) && rowIsEmpty(frame.offsetY + frame.height - 1) && frame.height > 0) { frame.offsetY += 1; frame.height -= 2; }
    while (colIsEmpty(frame.offsetX) && colIsEmpty(frame.offsetX + frame.width  - 1) && frame.width  > 0) { frame.offsetX += 1; frame.width  -= 2; }
    return frame;
  }

  getDataToStore(frame: ReturnType<FractalRenderer['getFrameToStore']>) {
    const data = new Int32Array(frame.width * frame.height);
    for (let y = 0; y < frame.height; y++) {
      const start = frame.offsetX + (frame.offsetY + y) * this.width;
      data.set(this.sums.subarray(start, start + frame.width), y * frame.width);
    }
    return data;
  }

  storeInCache() {
    const frame = this.frameFromCache ?? this.getFrameToStore()
    if (frame.width <= 0 || frame.height <= 0) return;
    const data = this.getDataToStore(frame);
    const resumeData = JSON.stringify(this.getResumeData());
    const formInRendering = this.formInRendering;
    setTimeout(() => FractalRenderer.imageCache.put(formInRendering, frame.width, frame.height, data, resumeData), 100);
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
    this.renderTime += getMs() - startMs;
  }
  
  priority() { return !this.pointsCount ? this.initPriority : this.drawPriority + this.pointsCount / this.pointsPerImage; }
  
  isFinished() { return this.pointsCount >= this.pointsPerImage && !this.renderInfinitely; }
  
  draw = () => {
    if (!this.ctx || !this.imageData) return;
    for (let i = this.sums.length - 1; i >= 0; i--) {
      if (this.maxSum < this.sums[i]!) {
        this.maxSum = this.sums[i]!;
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

  getResumeData() {
    return {
      pointsCount: this.pointsCount,
      dataMin: this.dataMin,
      dataMax: this.dataMax,
      x: this.pointsComputer.x,
      y: this.pointsComputer.y,
    };
  }

}
