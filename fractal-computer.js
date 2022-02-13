// FractalComputer

class FractalComputer {
  static FORMULA_ARRAY_SIZE = 0x4000;

  static randomSamplesArray = [];
  static formulaRandomizerArray;

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

  static ensureRandomArraySize(size) {
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
    for (let i = 0; i < FractalComputer.FORMULA_ARRAY_SIZE; i++)
      this.formulas.push(null);
  }
  
  initialize(formulas) {
    this.startms = getMilliseconds();
    this.x = 0;
    this.y = 0;
    this.randomXor = 0;
    let area = 0;
    for (let formula of formulas) {
      area += formula.getArea();
    }
    for (let formula of formulas)
      formula.p = formula.getArea() / area;
    for (let i = 0, formulaIndex = -1, accumulatedWeight = 0; i < FractalComputer.FORMULA_ARRAY_SIZE; i++) {
      if (i / FractalComputer.FORMULA_ARRAY_SIZE >= accumulatedWeight) {
        accumulatedWeight += formulas[++formulaIndex].p;
      }
      this.formulas[FractalComputer.formulaRandomizerArray[i]] = formulas[formulaIndex];
    }
  }

  compute(points) {
    FractalComputer.ensureRandomArraySize(points.length / 2);
    if (!this.randomXor) {
      this.computeFirst(points);
      return;
    }
    let x = this.x;
    let y = this.y;
    let randomXor = this.randomXor;
    let formulas = this.formulas;
    let pointPtr = points.length;
    let randomPtr = 0;
    while (pointPtr) {
      const f = formulas[FractalComputer.randomSamplesArray[randomPtr++] ^ randomXor];
      const tmp              = f.a * x + f.b * y + f.e;
      y = points[--pointPtr] = f.c * x + f.d * y + f.f;
      x = points[--pointPtr] = tmp;
    }
    this.x = x;
    this.y = y;
    this.randomXor ++;
  }

  computeFirst(points) {
    let x = this.x;
    let y = this.y;
    let randomXor = this.randomXor;
    let formulas = this.formulas;
    let pointPtr = points.length;
    let randomPtr = 0;
    while (pointPtr) {
      const f = formulas[FractalComputer.randomSamplesArray[randomPtr++]];
      const tmp              = f.a * x + f.b * y + f.e;
      y = points[--pointPtr] = f.c * x + f.d * y + f.f;
      x = points[--pointPtr] = tmp;
    }
    this.x = x;
    this.y = y;
    this.randomXor ++;
  }

}
