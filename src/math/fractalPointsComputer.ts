import Formula from "./formula";

export default class FractalPointsComputer {
  static FORMULA_ARRAY_SIZE = 0x4000;
  static randomSamplesArray = new Int16Array();
  static formulaRandomizerArray = new Int16Array();
  formulas: (Formula | null)[];
  x = 0;
  y = 0;
  randomXor = 0;
  startms = 0;

  static {
    this.ensureRandomArraySize(this.FORMULA_ARRAY_SIZE);
    this.formulaRandomizerArray = new Int16Array(this.FORMULA_ARRAY_SIZE);
    for (let i = 1; i < this.FORMULA_ARRAY_SIZE; i++) {
      let j = 0;
      while (this.formulaRandomizerArray[j] != 0)
        j = Math.floor(Math.random() * this.FORMULA_ARRAY_SIZE);
      this.formulaRandomizerArray[j] = i;
    }
  }

  static ensureRandomArraySize(size: number) {
    if (size <= this.randomSamplesArray.length) return;
    const tmpRandomSamplesArray = this.randomSamplesArray;
    this.randomSamplesArray = new Int16Array(size);
    this.randomSamplesArray.set(tmpRandomSamplesArray);
    for (let i = tmpRandomSamplesArray.length; i < size; i++) {
      this.randomSamplesArray[i] = (Math.random() * this.FORMULA_ARRAY_SIZE) | 0;
    }
  }
  
  constructor() {
    this.formulas = [];
    for (let i = 0; i < FractalPointsComputer.FORMULA_ARRAY_SIZE; i++)
      this.formulas.push(null);
  }
  
  initialize(formulas: Formula[]) {
    const attractor = formulas[0]!.getAttractor();
    this.x = attractor[0]!;
    this.y = attractor[1]!;
    this.randomXor = 0;
    Formula.normalizeFormulas(formulas);
    for (let i = 0, formulaIndex = -1, accumulatedWeight = 0; i < FractalPointsComputer.FORMULA_ARRAY_SIZE; i++) {
      if (i / FractalPointsComputer.FORMULA_ARRAY_SIZE >= accumulatedWeight) {
        accumulatedWeight += formulas[++formulaIndex]!.p;
      }
      this.formulas[FractalPointsComputer.formulaRandomizerArray[i]!] = formulas[formulaIndex]!;
    }
  }

  compute(points: Float64Array) {
    FractalPointsComputer.ensureRandomArraySize(points.length / 2);
    if (!this.randomXor) {
      this.computeFirst(points);
      return;
    }
    let x = this.x;
    let y = this.y;
    const randomXor = this.randomXor;
    const formulas = this.formulas;
    let pointPtr = points.length;
    let randomPtr = 0;
    while (pointPtr) {
      const f = formulas[FractalPointsComputer.randomSamplesArray[randomPtr++]! ^ randomXor]!;
      const tmp              = f.a * x + f.b * y + f.e;
      y = points[--pointPtr] = f.c * x + f.d * y + f.f;
      x = points[--pointPtr] = tmp;
    }
    this.x = x;
    this.y = y;
    if (++this.randomXor >= FractalPointsComputer.FORMULA_ARRAY_SIZE) this.randomXor = 0;
  }

  computeFirst(points: Float64Array) {
    let x = this.x;
    let y = this.y;
    const formulas = this.formulas;
    let pointPtr = points.length;
    let randomPtr = 0;
    while (pointPtr) {
      const f = formulas[FractalPointsComputer.randomSamplesArray[randomPtr++]!]!;
      const tmp              = f.a * x + f.b * y + f.e;
      y = points[--pointPtr] = f.c * x + f.d * y + f.f;
      x = points[--pointPtr] = tmp;
    }
    this.x = x;
    this.y = y;
    this.randomXor ++;
  }

}
