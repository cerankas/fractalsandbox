// FractalComputer

const FORMULA_TABLE_SIZE = 0x4000;
const RANDOM_ARRAY_SIZE = 5000000;

const randomSamplesArray = new Int16Array(RANDOM_ARRAY_SIZE);
const formulaRandomizerArray = new Int16Array(FORMULA_TABLE_SIZE);

function initializeRandom() {
  for (let i = 0; i < RANDOM_ARRAY_SIZE; i++) {
    randomSamplesArray[i] = (Math.random() * FORMULA_TABLE_SIZE) | 0;
  }
  for (let i = 1; i < FORMULA_TABLE_SIZE; i++) {
    let j = 0;
    while (formulaRandomizerArray[j] != 0)
      j = Math.floor(Math.random() * FORMULA_TABLE_SIZE);
    formulaRandomizerArray[j] = i;
  }
}

class FractalComputer {
  constructor() {
    this.formulas = [];
    for (let i = 0; i < FORMULA_TABLE_SIZE; i++)
      this.formulas.push(null);
  }
  
//  getAdjustedArea(area, balanceFactor) {
//    return Math.pow(area, balanceFactor);
//  }

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
    for (let i = 0, formulaIndex = -1, accumulatedWeight = 0; i < FORMULA_TABLE_SIZE; i++) {
      if (i / FORMULA_TABLE_SIZE >= accumulatedWeight) {
        accumulatedWeight += formulas[++formulaIndex].p;
      }
      this.formulas[formulaRandomizerArray[i]] = formulas[formulaIndex];
    }
  }

  compute(points) {
    let x = this.x;
    let y = this.y;
    let randomXor = this.randomXor;
    let formulas = this.formulas;
    let pointPtr = points.length;
    let randomPtr = 0;
    while (pointPtr) {
      const f = formulas[randomSamplesArray[randomPtr++] ^ randomXor];
      const tmp              = f.a * x + f.b * y + f.e;
      y = points[--pointPtr] = f.c * x + f.d * y + f.f;
      x = points[--pointPtr] = tmp;
    }
    this.x = x;
    this.y = y;
    this.randomXor ++;
  }
}

initializeRandom();
