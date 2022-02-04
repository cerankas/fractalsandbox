// Utils

function getMilliseconds() { return Number(new Date()); }



let lastForm = null;
function peekOnFormChange() {
  const form = (selectedFormula != null) ? JSON.stringify(fractal.formulas[selectedFormula.formula]) : '';
  if (form != '' && form != lastForm) {
    lastForm = form;
    //let r = fractal.formulas[selectedFormula.formula].getRotation();
    let r = fractal.formulas[selectedFormula.formula].getScale();
    //console.log(r[0], r[1], r[2])
  }
}


/*function memoryTest() {
  let memoryTestStepSize = 100 * 1000 * 1000;
  const t = [];
  while (true) 
    try {
      t.push(new Int8Array(memoryTestStepSize));
    } catch (error) {
      alert('failure after allocating ' + memoryTestStepSize * t.length +  ' bytes');
      return;
    }
}*/
