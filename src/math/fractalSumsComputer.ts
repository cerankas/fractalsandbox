import type Formula from './formula';
import FractalPointsComputer from './fractalPointsComputer';
import { getBoundingBoxFrom1DArray } from './util';
import Viewport from './viewport';

export default class FractalSumsComputer extends Viewport {
  width = 0;
  height = 0;

  pointsComputer = new FractalPointsComputer();
  formulas: Formula[] = [];

  points = new Float64Array();
  densityPerCall = 2;    // average number of calculated points per image pixel per call
  densityPerImage = 100; // average number of calculated points per image pixel per finished image
  pointsPerCall = 0;

  calculatedPointsCount = 0;
  maxSum = 0;

  constructor(zoom: number) {
    super(zoom);
  }

  get area() { return this.width * this.height; }

  setWidthHeight(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.pointsPerCall = this.area * this.densityPerCall;
    this.prepare();
  }
  
  setFormulas(formulas: Formula[]) {
    this.formulas = formulas;
    this.prepare();
  }

  prepare() {
    this.calculatedPointsCount = 0;
    if (this.points.length != 2 * this.pointsPerCall) this.points = new Float64Array(2 * this.pointsPerCall);
    this.pointsComputer.initialize(this.formulas);
    this.maxSum = 0;
  }

  compute(sums: Int32Array, initialize?: boolean) {
    this.doCalculatePoints();
    if (initialize??false) this.doAutoScale();
    this.doSumPoints(sums);
  }
  
  doCalculatePoints() {
    this.calculatedPointsCount += this.pointsPerCall;
    this.pointsComputer.compute(this.points);
  }
  
  doAutoScale() {
    const boundingBox = getBoundingBoxFrom1DArray(this.points);
    this.setBoundingBox(...boundingBox);
  }

  doSumPoints(sums: Int32Array) {
    for (let i = 0; i < this.points.length; i += 2) {
      const x = ( this.points[i    ]! * this.scale + this.shiftX) | 0;
      const y = (-this.points[i + 1]! * this.scale + this.shiftY) | 0;
      if (x > 0 && x <= this.width && y > 0 && y <= this.height) {
        const j = x - 1 + this.width * (y - 1);
        sums[j] ++;
      }
    }
  }
    
}
