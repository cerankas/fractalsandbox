
function isBalanced(formulas) {
  const area = 0;
  for (let formula of formulas)
    area += formula.getArea();
  for (let formula of formulas)
    if (formula.p != formula.getArea() / area)
      return false;
  return true;
}