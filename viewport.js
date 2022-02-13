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

  resetToAuto() {
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
    const screenCenter = screenSize.mul(.5);
    const dataSize = this.minMax[1].sub(this.minMax[0]);
    const dataCenter = this.minMax[1].add(this.minMax[0]).mul(.5);
    this.scale = Math.min(screenSize[0] / dataSize[0], screenSize[1] / dataSize[1]) * this.autoZoom * this.manualScale;
    const tmpShift = [
      screenCenter[0] - dataCenter[0] * this.scale,
      screenCenter[1] + dataCenter[1] * this.scale
    ];
    this.shift = tmpShift.add(this.manualShift);
  }
 
  onWheel(e) {
    const scaleMultiplier = (e.deltaY < 0) ? 1.1 : 1 / 1.1;
    const screenMousePoint = getEventOffsetXY(e);
    const dataMousePoint = this.fromScreen(screenMousePoint);
    this.manualScale *= scaleMultiplier;
    this.updateTransform();
    const uncorrectedScreenMousePoint = this.toScreen(dataMousePoint);
    this.manualShift = this.manualShift.add(screenMousePoint).sub(uncorrectedScreenMousePoint);
    this.updateTransform();
    this.viewChanged = true;
  }

  registerWheelListener() {
    this.ctx.canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: true });
  }

  viewToString() {
    return this.scale + ' ' + this.shift[0] + ' ' + this.shift[1];
  }

}
