import { type vec2, vec2add, vec2sub, vec2mul, vec2div, vec2div1 } from "./vec2";

export default class Viewport {
  scale = 1;
  shift: vec2 = [0, 0];
  
  size: vec2 = [1, 1];
  get width()  { return this.size[0]; }
  get height() { return this.size[1]; }

  manualScale = 1;
  manualShift: vec2 = [0, 0];
  
  dataMin: vec2 = [0, 0];
  dataMax: vec2 = [1, 1];
  
  constructor(public autoZoom: number) {}

  toScreen(point: vec2): vec2 {
    return vec2add(vec2mul(point, [this.scale, -this.scale]), this.shift);
  }

  fromScreen(point: vec2): vec2 {
    return vec2div(vec2sub(point, this.shift), [this.scale, -this.scale]);
  }

  setSize(size: vec2) {
    this.size = size;
    this.updateTransform();
  }

  resetToAuto() {
    this.manualScale = 1;
    this.manualShift = [0, 0];
    this.updateTransform();
  }

  setBoundingBox(dataMin: vec2, dataMax: vec2) {
    this.dataMin = dataMin;
    this.dataMax = dataMax;
    this.updateTransform();
  }

  updateTransform() {
    const center = vec2div1(this.size, 2);
    const dataCenter = vec2div1(vec2add(this.dataMax,  this.dataMin), 2);
    const dataSize =  vec2sub(this.dataMax, this.dataMin);
    this.scale = Math.min(...vec2div(this.size, dataSize)) * this.autoZoom * this.manualScale;
    const tmpShift = vec2sub(center, vec2mul(dataCenter, [this.scale, -this.scale]));
    this.shift = vec2add(tmpShift, this.manualShift);
  }
  
  rescale(scaleMultiplier: number, screenPoint: vec2) {
    const dataPoint = this.fromScreen(screenPoint);
    this.manualScale *= scaleMultiplier;
    this.updateTransform();
    const unshifted = this.toScreen(dataPoint);
    this.manualShift = vec2add(this.manualShift, vec2sub(screenPoint, unshifted));
    this.updateTransform();
  }

}
