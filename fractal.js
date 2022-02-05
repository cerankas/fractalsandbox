// Fractal

class Fractal {
  constructor() {
    this.formulas = [];
    const args = arguments[0].replace(/#/g, '\n').split('\n');
    for (let arg of args)
      this.formulas.push(new Formula(arg));
  }
  toString() {
    let ret = '';
    for (let formula of this.formulas)
      ret += formula.toString() + '#';
    ret = ret.substr(0, ret.length - 1);
    return ret;
  }
}

function isBalanced(formulas) {
  const area = 0;
  for (let formula of formulas)
    area += formula.getArea();
  for (let formula of formulas)
    if (formula.p != formula.getArea() / area)
      return false;
  return true;
}
