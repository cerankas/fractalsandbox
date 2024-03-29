import Vec from "./vector";

export default class Formula {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  p: number;
  
  constructor(string?: string) {
    string = string ?? '.9 0 0 .9 0 0 1';
    const numbers = string.split(' ');
    const values: number[] = numbers.map(s => parseFloat(s));
    this.a = values[0]!;
    this.b = values[1]!;
    this.c = values[2]!;
    this.d = values[3]!;
    this.e = values[4]!;
    this.f = values[5]!;
    this.p = values[6]!;
  }

  clone() {
    return new Formula(this.toString());
  }

  toString() {
    return `${this.a} ${this.b} ${this.c} ${this.d} ${this.e} ${this.f} ${this.p}`
  }

  iterate(point: number[]) {
    const x = point[0]!;
    const y = point[1]!;
    return [
      this.a * x + this.b * y + this.e,
      this.c * x + this.d * y + this.f
    ];
  }

  getAttractor() {
    const aa = this.a - 1;
    const dd = this.d - 1;
    const w = aa * dd - this.b * this.c;
    const wx = this.b * this.f -     dd * this.e;
    const wy =     aa * this.f - this.c * this.e;
    return [wx / w, wy / w];
  }

  get area() {
    return Math.abs(this.b * this.c - this.a * this.d);
  }

  get rotation() { 
    const rx = new Vec(this.a, this.c).angle;
    const ry = new Vec(this.b, this.d).angle - 90;
    return [rx, ry];
  }

  set rotation(r: number[]) {
    const rx = r[0]!;
    const ry = r[1]!;
    const s = this.scale;
    this.setAC(new Vec(s[0]!, 0).rotate(rx));
    this.setBD(new Vec(0, s[1]!).rotate(ry));
  }

  get scale() { 
    const sx = new Vec(this.a, this.c).magnitude;
    const sy = new Vec(this.b, this.d).magnitude;
    return [sx, sy];
  }

  set scale(s: number[]) {
    const sx = s[0]!;
    const sy = s[1]!;
    const r = this.rotation;
    this.setAC(new Vec(sx, 0).rotate(r[0]!));
    this.setBD(new Vec(0, sy).rotate(r[1]!));
  }

  setAC(v: number[]) {
    this.a = v[0]!;
    this.c = v[1]!;
  }

  setBD(v: number[]) {
    this.b = v[0]!;
    this.d = v[1]!;
  }

  rotate(rx: number, ry: number) {
    this.setAC(new Vec(this.a, this.c).rotate(rx));
    this.setBD(new Vec(this.b, this.d).rotate(ry));
  }

  multiply(sx: number, sy: number) {
    this.a *= sx;
    this.c *= sx;
    this.b *= sy;
    this.d *= sy;
  }

  shift(dx: number, dy: number) {
    this.e += dx;
    this.f += dy;
  }

  static formulasFromString(fractalString: string) {
    const formulas = [];
    const strings = fractalString.split(',');
    for (const string of strings) {
      formulas.push(new Formula(string));
    }
    return formulas;
  }
  
  static formulasToString(formulas: Formula[]) {
    let string = formulas[0]!.toString();
    for (let i = 1; i < formulas.length; i++) {
      string += ',' + formulas[i]!.toString();
    }
    return string;
  }
  
  static normalizeFormulas(formulas: Formula[]) {
    let area = 0;
    for (const formula of formulas) {
      area += formula.area;
    }
    for (const formula of formulas)
      formula.p = formula.area / area;
  }

}
