// Formula

class Formula {
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
    let rx = getVectorAngle([this.a, this.c]);
    let ry = getVectorAngle([this.b, this.d]); - 90;
    return [rx, ry];
  }

  getScale() { 
    let sx = Math.sqrt(this.a * this.a + this.c * this.c);
    let sy = Math.sqrt(this.b * this.b + this.d * this.d);
    return [sx, sy];
  }

  setRotation(rx, ry) {
    let s = this.getScale();
    [this.a, this.c] = rotateVector([s[0], 0], rx);
    [this.b, this.d] = rotateVector([0, s[1]], ry);
  }

  setScale(sx, sy) {
    const r = this.getRotation();
    [this.a, this.c] = rotateVector([sx, 0], r[0]);
    [this.b, this.d] = rotateVector([0, sy], r[1]);
  }

  rotate(rx, ry) {
    [this.a, this.c] = rotateVector([this.a, this.c], rx);
    [this.b, this.d] = rotateVector([this.b, this.d], ry);
  }

  scale(sx, sy) {
    this.a *= sx;
    this.c *= sx;
    this.b *= sy;
    this.d *= sy;
  }
}

function rotateVector(vector, angle) {
  angle *= Math.PI / 180;
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  return [
    vector[0] * cos - vector[1] * sin,
    vector[0] * sin + vector[1] * cos
  ];
}

function getVectorAngle(vector) {
  return Math.atan2(vector[1], vector[0]) * 180 / Math.PI;
}

function getVectorRotation(vector1, vector2) {
  const radius = getVectorRotation(vector2) - getVectorRotation(vector1);
  if (radius >   180) radius -= 180;
  if (radius <= -180) radius += 180;
  return radius;
}

function getVectorLength(vector) {
  return Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
}

function getVectorScale(vector1, vector2) {
  const length1 = getVectorLength(vector1);
  return getVectorLength(vector2) / (length1 != 0 ? length1 : 1);
}
