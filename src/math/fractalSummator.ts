import type Formula from './formula';
import FractalIterator from './fractalIterator';
import { getBoundingBoxFrom1DArray } from './util';
import Viewport from './viewport';

export default class FractalSummator extends Viewport {
  pointsComputer = new FractalIterator();
  formulas: Formula[] = [];

  points = new Float64Array();
  densityPerStage = 2;   // average number of calculated points per image pixel per stage
  densityPerImage = 100; // average number of calculated points per image pixel per finished image
  pointsPerStage = 0;

  pointsCount = 0;
  maxSum = 0;

  constructor(zoom: number) {
    super(zoom);
  }

  get area() { return this.width * this.height; }

  setSize(size: [number, number]) {
    super.setSize(size);
    this.pointsPerStage = this.area * this.densityPerStage;
  }
  
  prepare() {
    this.pointsCount = 0;
    if (this.points.length != 2 * this.pointsPerStage) this.points = new Float64Array(2 * this.pointsPerStage);
    this.pointsComputer.initialize(this.formulas);
    this.maxSum = 0;
  }

  process(sums: Int32Array, initialize?: boolean) {
    this.calculatePoints();
    if (initialize??false) this.autoScale();
    this.sumPoints(sums);
  }
  
  calculatePoints() {
    this.pointsCount += this.pointsPerStage;
    this.pointsComputer.compute(this.points);
  }
  
  autoScale() {
    const [min, max] = getBoundingBoxFrom1DArray(this.points);
    this.setBoundingBox(min, max);
  }

  sumPoints(sums: Int32Array) {
    const [shiftX, shiftY] = this.shift;
    const [width, height] = this.size;
    for (let i = 0; i < this.points.length; i += 2) {
      const x = ( this.points[i    ]! * this.scale + shiftX) | 0;
      const y = (-this.points[i + 1]! * this.scale + shiftY) | 0;
      if (x > 0 && x <= width && y > 0 && y <= height) {
        const j = x - 1 + width * (y - 1);
        sums[j] ++;
      }
    }
  }
    
}
