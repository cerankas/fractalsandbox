//export { Formula };

class Formula {
  //    static fromCoefficients(a, b, c, d, e, f, p)

  constructor(a, b, c, d, e, f, p) {
    if (arguments.length == 0) {
      this.a = .9;
      this.b = 0;
      this.c = 0;
      this.d = .9;
      this.e = 0;
      this.f = 0;
      this.p = .81;
    }
    if (arguments.length == 1) {
      [a, b, c, d, e, f, p] = a.split(' ');
      this.a = parseFloat(a);
      this.b = parseFloat(b);
      this.c = parseFloat(c);
      this.d = parseFloat(d);
      this.e = parseFloat(e);
      this.f = parseFloat(f);
      this.p = parseFloat(p);
    }
    if (arguments.length > 1) {
      this.a = a;
      this.b = b;
      this.c = c;
      this.d = d;
      this.e = e;
      this.f = f;
      this.p = p;
    }
  }

  clone() {
    return new Formula(this.a, this.b, this.c, this.d, this.e, this.f, this.p);
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

  fromPoints(points) {
    this.a = points[2][0] - points[0][0];
    this.b = points[1][0] - points[0][0];
    this.c = points[2][1] - points[0][1];
    this.d = points[1][1] - points[0][1];
    this.e = points[0][0];
    this.f = points[0][1];
  }

  getPoints() {
    return [
      this.iterate([0, 0]),
      this.iterate([0, 1]),
      this.iterate([1, 0]),
      this.iterate([-1, 0])
    ];
  }

  getArea() {
    return Math.abs(this.b * this.c - this.a * this.d);
  }

  setPoint(dx, dy, n) {
    function sp(n) {
      p[n][0] += dx;
      p[n][1] += dy;
    }
    let p = this.getPoints();
    if (!n)
      for (let i in p)
        sp(i);
    if (n === 1)
      sp(1);
    if (n > 1) {
      sp(n);
      dx = -dx;
      dy = -dy;
      sp(5 - n);
    }
    this.fromPoints(p);
  }

  getRotation() { 
    let a1 = Math.atan2(this.c, this.a) * 180 / Math.PI;
    let a2 = Math.atan2(-this.b, this.d) * 180 / Math.PI;
    let a3 = Math.atan2(this.d, this.b) * 180 / Math.PI - 90;
    return [a1, a2, a3];
  }

}
  