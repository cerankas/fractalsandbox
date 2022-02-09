// Vector

Array.prototype.vectorOp = function(v, op) {
  const result = [];
  for (let i = 0; i < this.length; i++)
    result[i] = op(this[i], v.length ? v[i] : v);
  return result;
}

Array.prototype.add = function(v) {
  return this.vectorOp(v, (a, b) => { return a + b; }) ;
}

Array.prototype.sub = function(v) {
  return this.vectorOp(v, (a, b) => { return a - b; }) ;
}

Array.prototype.mul = function(v) {
  return this.vectorOp(v, (a, b) => { return a * b; }) ;
}

Array.prototype.div = function(v) {
  return this.vectorOp(v, (a, b) => { return a / b; }) ;
}

Array.prototype.vectorRotate = function(angle) {
  angle *= Math.PI / 180;
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  return [
    this[0] * cos - this[1] * sin,
    this[0] * sin + this[1] * cos
  ];
}

Array.prototype.vectorAngle = function() {
  return Math.atan2(this[1], this[0]) * 180 / Math.PI;
}

Array.prototype.vectorAngleDifference = function(vector) {
  let angle = vector.vectorAngle() - this.vectorAngle();
  if (angle >   180) angle -= 360;
  if (angle <= -180) angle += 360;
  return angle;
}

Array.prototype.vectorLength = function() {
  return Math.sqrt(this[0] * this[0] + this[1] * this[1]);
}

Array.prototype.vectorLengthRatio = function(vector) {
  const length = this.vectorLength();
  return vector.vectorLength() / (length != 0 ? length : 1);
}
