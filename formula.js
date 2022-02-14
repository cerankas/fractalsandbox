// Formula

class Formula {
  
  constructor(string) {
    string = string || '.9 0 0 .9 0 0 .81';
    const numbers = string.split(' ');
    numbers.forEach((element, index, array) => { array[index] = parseFloat(element); });
    this.a = numbers[0];
    this.b = numbers[1];
    this.c = numbers[2];
    this.d = numbers[3];
    this.e = numbers[4];
    this.f = numbers[5];
    this.p = numbers[6];
  }

  clone() {
    return new Formula(this.toString());
  }

  toString() {
    return this.a + ' ' + this.b + ' ' + this.c + ' ' +  this.d + ' ' + this.e + ' ' + this.f + ' ' + this.p;
  }

  iterate(point) {
    return [
      this.a * point[0] + this.b * point[1] + this.e,
      this.c * point[0] + this.d * point[1] + this.f
    ];
  }

  getArea() {
    return Math.abs(this.b * this.c - this.a * this.d);
  }

  getRotation() { 
    let rx = [this.a, this.c].vectorAngle();
    let ry = [this.b, this.d].vectorAngle() - 90;
    return [rx, ry];
  }

  getScale() { 
    let sx = [this.a, this.c].vectorLength();
    let sy = [this.b, this.d].vectorLength();
    return [sx, sy];
  }

  setAC(v) {
    this.a = v[0];
    this.c = v[1];
  }

  setBD(v) {
    this.b = v[0];
    this.d = v[1];
  }

  setRotation(rx, ry) {
    let s = this.getScale();
    this.setAC([s[0], 0].vectorRotate(rx));
    this.setBD([0, s[1]].vectorRotate(ry));
  }

  setScale(sx, sy) {
    const r = this.getRotation();
    this.setAC([sx, 0].vectorRotate(r[0]));
    this.setBD([0, sy].vectorRotate(r[1]));
  }

  rotate(rx, ry) {
    this.setAC([this.a, this.c].vectorRotate(rx));
    this.setBD([this.b, this.d].vectorRotate(ry));
  }

  scale(sx, sy) {
    this.a *= sx;
    this.c *= sx;
    this.b *= sy;
    this.d *= sy;
  }

  shift(dx, dy) {
    this.e += dx;
    this.f += dy;
  }

}

function formulasFromString(fractalString) {
  const formulas = [];
  const strings = fractalString.replaceAll(',', '#').split('#');
  for (let string of strings) {
    formulas.push(new Formula(string));
  }
  return formulas;
}

function formulasToString(formulas) {
  let string = formulas[0].toString();
  for (let i = 1; i < formulas.length; i++) {
    string += '#' + formulas[i].toString();
  }
  return string;
}

function normalizeFormulas(formulas) {
  let area = 0;
  for (let formula of formulas) {
    area += formula.getArea();
  }
  for (let formula of formulas)
    formula.p = formula.getArea() / area;
}