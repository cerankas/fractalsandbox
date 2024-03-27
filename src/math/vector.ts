export default class Vec extends Array<number> {
 
  operate(v: number | number[] | Vec, op: (a: number, b: number) => number) {
    return this.map((t, i) => op(t, (typeof v === 'number') ? v : v[i]!));
  }

  add(v: number | number[]) { return this.operate(v, (a, b) => { return a + b; }); }
  sub(v: number | number[]) { return this.operate(v, (a, b) => { return a - b; }); }
  mul(v: number | number[]) { return this.operate(v, (a, b) => { return a * b; }); }
  div(v: number | number[]) { return this.operate(v, (a, b) => { return a / b; }); }

  rotate(angle: number) {
    angle *= Math.PI / 180;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const x = this[0]!;
    const y = this[1]!;
    return [
      x * cos - y * sin,
      x * sin + y * cos
    ];
  }

  vectorAngle = function(this: Vec) {
    return Math.atan2(this[1]!, this[0]!) * 180 / Math.PI;
  }

  get angle() {
    return Math.atan2(this[1]!, this[0]!) * 180 / Math.PI;
  }

  angleDifference(vector: Vec) {
    let angle = vector.angle - this.angle;
    if (angle >   180) angle -= 360;
    if (angle <= -180) angle += 360;
    return angle;
  }

  get magnitude() {
    const x = this[0]!;
    const y = this[1]!;
    return Math.sqrt(x * x + y * y);
  }

  magnitudeRatio(this: Vec, vector: Vec) {
    return vector.magnitude / this.magnitude || 1;
  }

}