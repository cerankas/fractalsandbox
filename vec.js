// Vec

class Vec extends Array {

  constructor(v) {
    super();
    if (arguments.length != 1)
      v = arguments;
    if (!v || !v.length)
      return;
    for (let i in v) this[i] = v[i];
  }

  doOp(v, op) {
    const result = new Vec();
    if (v.length == 1)
      v = v[0];
    for (let i in this)
      result[i] = op(this[i], v.length ? v[i] : v);
    return result;
  }

  add(v) {
    return this.doOp(v, (a, b) => { return a + b; }) ;
  }

  sub(v) {
    return this.doOp(v, (a, b) => { return a - b; }) ;
  }

  mul(v) {
    return this.doOp(v, (a, b) => { return a * b; }) ;
  }

  div(v) {
    return this.doOp(v, (a, b) => { return a / b; }) ;
  }

}