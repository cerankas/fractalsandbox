// Viewport

class Viewport {
  constructor(ctx, zoom) {
    this.ctx = ctx;
    this.scale = 1;
    this.shiftx = 0;
    this.shifty = 0;
    this.manualScale = 1;
    this.manualShiftx = 0;
    this.manualShifty = 0;
    this.autoZoom = zoom || 0.9;
    this.minMax = [[0, 0], [1, 1]];
  }
  toScreen(p) {
    return [p[0] * this.scale + this.shiftx, -p[1] * this.scale + this.shifty];
  }
  fromScreen(p) {
    return [(p[0] - this.shiftx) / this.scale, (-p[1] + this.shifty) / this.scale];
  }
  resetManual() {
    this.manualScale = 1;
    this.manualShiftx = 0;
    this.manualShifty = 0;
    this.updateTransform();
  }
  setMinMax(minMax) {
    this.minMax = minMax;
    this.updateTransform();
  }
  updateTransform() {
    const sx = this.ctx.canvas.width / 2;
    const sy = this.ctx.canvas.height / 2;
    const dx = (this.minMax[1][0] - this.minMax[0][0]) / 2;
    const dy = (this.minMax[1][1] - this.minMax[0][1]) / 2;
    const fx = (this.minMax[1][0] + this.minMax[0][0]) / 2;
    const fy = (this.minMax[1][1] + this.minMax[0][1]) / 2;
    this.scale = Math.min(sx / dx, sy / dy) * this.autoZoom * this.manualScale;
    this.shiftx = sx - fx * this.scale + this.manualShiftx;
    this.shifty = sy + fy * this.scale + this.manualShifty;
  }
}
