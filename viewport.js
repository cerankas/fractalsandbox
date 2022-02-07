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
    const screenSize = [
      this.ctx.canvas.width,
      this.ctx.canvas.height
    ];
    const screenCenter = multiplyVector(screenSize, .5);
    const dataSize = subtractVectors(this.minMax[1], this.minMax[0]);
    const dataCenter = multiplyVector(addVectors(this.minMax[1], this.minMax[0]), .5);
    this.scale = Math.min(screenSize[0] / dataSize[0], screenSize[1] / dataSize[1]) * this.autoZoom * this.manualScale;
    const tmpShift = [
      screenCenter[0] - dataCenter[0] * this.scale,
      screenCenter[1] + dataCenter[1] * this.scale
    ];
    this.shift = addVectors(tmpShift, this.manualShift);
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
