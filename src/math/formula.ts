import { floatToShortString } from "./util";
import { type vec2, vec2angle, vec2magnitude, vec2rotate } from "./vec2";

export default class Formula {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  w: number;
  p = 1;
  
  constructor(string?: string) {
    string = string ?? '.9,0,0,.9,0,0,1';
    const values: number[] = string.split(',').map(parseFloat);
    if (values.some(value => !Number.isFinite(value))) throw new Error('Error creating Formula from string: ' + string);
    this.a = values[0]!;
    this.b = values[1]!;
    this.c = values[2]!;
    this.d = values[3]!;
    this.e = values[4]!;
    this.f = values[5]!;
    this.w = values[6]!;
  }

  clone(): Formula {
    return new Formula(this.toString());
  }

  toString(): string {
    return [this.a, this.b, this.c, this.d, this.e, this.f, this.w].map(floatToShortString).join(',');
  }

  iterate(point: vec2): vec2 {
    const x = point[0];
    const y = point[1];
    return [
      this.a * x + this.b * y + this.e,
      this.c * x + this.d * y + this.f
    ];
  }

  getAttractor(): vec2 {
    const aa = this.a - 1;
    const dd = this.d - 1;
    const w = aa * dd - this.b * this.c;
    const wx = this.b * this.f -     dd * this.e;
    const wy =     aa * this.f - this.c * this.e;
    return [wx / w, wy / w];
  }

  get area(): number {
    return Math.abs(this.b * this.c - this.a * this.d) * this.w;
  }

  get rotation(): vec2 { 
    const rx = vec2angle([this.a, this.c]);
    const ry = vec2angle([this.b, this.d]) - 90;
    return [rx, ry];
  }

  set rotation(r: vec2) {
    const rx = r[0];
    const ry = r[1];
    const s = this.scale;
    this.setAC(vec2rotate([s[0], 0], rx));
    this.setBD(vec2rotate([0, s[1]], ry));
  }

  get scale(): vec2 { 
    const sx = vec2magnitude([this.a, this.c]);
    const sy = vec2magnitude([this.b, this.d]);
    return [sx, sy];
  }

  set scale(s: vec2) {
    const sx = s[0];
    const sy = s[1];
    const r = this.rotation;
    this.setAC(vec2rotate([sx, 0], r[0]));
    this.setBD(vec2rotate([0, sy], r[1]));
  }

  setAC(v: vec2) {
    this.a = v[0];
    this.c = v[1];
  }

  setBD(v: vec2) {
    this.b = v[0];
    this.d = v[1];
  }

  rotate(r: vec2) {
    this.setAC(vec2rotate([this.a, this.c], r[0]));
    this.setBD(vec2rotate([this.b, this.d], r[1]));
  }

  rescale(s: vec2) {
    this.a *= s[0];
    this.c *= s[0];
    this.b *= s[1];
    this.d *= s[1];
  }

  shift(d: vec2) {
    this.e += d[0];
    this.f += d[1];
  }

  static normalize(formulas: Formula[]) {
    let area = 0;
    for (const formula of formulas) area += formula.area;
    for (const formula of formulas) formula.p = formula.area / area;
  }
  
  static fromString(fractalString: string): Formula[] {
    return fractalString.split(';').map(s => new Formula(s));
  }
  
  static toString(formulas: Formula[]): string {
    return formulas.map(f => f.toString()).join(';');
  }
  
}