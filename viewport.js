// Viewport

class Viewport {

  constructor(ctx, zoom) {
    this.ctx = ctx;
    this.scale = 1;
    this.shift = [0, 0];
    this.manualScale = 1;
    this.manualShift = [0, 0];
    this.autoZoom = zoom || 0.9;
    this.minMax = [[0, 0], [1, 1]];
    this.doZoom = false;
    ctx.canvas.addEventListener('wheel', this.onWheel.bind(this), {passive:true});
  }

  toScreen(p) {
    return [
       p[0] * this.scale + this.shift[0],
      -p[1] * this.scale + this.shift[1]
    ];
  }

  fromScreen(p) {
    return [
      ( p[0] - this.shift[0]) / this.scale,
      (-p[1] + this.shift[1]) / this.scale
    ];
  }

  resetManual() {
    this.manualScale = 1;
    this.manualShift = [0, 0];
    this.updateTransform();
  }

  setMinMax(minMax) {
    this.minMax = minMax;
    this.updateTransform();
  }
 
  updateTransform() {
    const s = [
      this.ctx.canvas.width,
      this.ctx.canvas.height
    ];
    const d = subtractVectors(this.minMax[1], this.minMax[0]);
    const f =      addVectors(this.minMax[1], this.minMax[0]);
    this.scale = Math.min(s[0] / d[0], s[1] / d[1]) * this.autoZoom * this.manualScale;
    this.shift = [
      (s[0] - f[0] * this.scale + this.manualShift[0]) / 2,
      (s[1] + f[1] * this.scale + this.manualShift[1]) / 2
    ];
  }
 
  onWheel(e) {
    const delta = (e.deltaY < 0) ? 1.1 : 1 / 1.1;
    const mousePoint = getEventClientXY(e);
    const p0 = this.fromScreen(mousePoint);
    this.manualScale *= delta;
    this.updateTransform();
    const p = this.toScreen(p0);
    this.manualShift = addVectors(this.manualShift, subtractVectors(mousePoint, p));
    this.updateTransform();
    this.doZoom = true;
  }

}
