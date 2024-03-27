export default class Viewport {
  scale = 1;
  shiftX = 0;
  shiftY = 0;
  
  width = 1;
  height = 1;

  manualScale = 1;
  manualShiftX = 0;
  manualShiftY = 0;
  
  minX = 0;
  maxX = 1;
  minY = 0;
  maxY = 1;
  
  constructor(public autoZoom: number) {}

  toScreen(x: number, y: number): [number, number] {
    return [
       x * this.scale + this.shiftX,
      -y * this.scale + this.shiftY
    ];
  }

  fromScreen(x: number, y: number): [number, number] {
    return [
      ( x - this.shiftX) / this.scale,
      (-y + this.shiftY) / this.scale
    ];
  }

  setWidthHeight(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.updateTransform();
  }

  resetToAuto() {
    this.manualScale = 1;
    this.manualShiftX = 0;
    this.manualShiftY = 0;
    this.updateTransform();
  }

  setBoundingBox(minX: number, minY: number, maxX: number, maxY: number) {
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
    this.updateTransform();
  }

  updateTransform() {
    const centerX = this.width  / 2;
    const centerY = this.height / 2;
    const dataWidth   =  this.maxX - this.minX;
    const dataHeight  =  this.maxY - this.minY;
    const dataCenterX = (this.maxX + this.minX) / 2;
    const dataCenterY = (this.maxY + this.minY) / 2;
    this.scale = Math.min(this.width / dataWidth, this.height / dataHeight) * this.autoZoom * this.manualScale;
    const tmpShiftX = centerX - dataCenterX * this.scale;
    const tmpShiftY = centerY + dataCenterY * this.scale
    this.shiftX = tmpShiftX + this.manualShiftX;
    this.shiftY = tmpShiftY + this.manualShiftY;
  }
  
  rescale(scaleMultiplier: number, screenX: number, screenY: number) {
    const [dataX, dataY] = this.fromScreen(screenX, screenY);
    this.manualScale *= scaleMultiplier;
    this.updateTransform();
    const [unshiftedX, unshiftedY] = this.toScreen(dataX, dataY);
    this.manualShiftX += screenX - unshiftedX;
    this.manualShiftY += screenY - unshiftedY;
    this.updateTransform();
  }

}
