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

function downloadImage() {
  document.getElementById('download').href = document.getElementById('canvasFrac').toDataURL('image/png');
  document.getElementById('download').click();
}

function saveFractal() {
  let key = 'fractal#' + new Date().toISOString();
  localStorage.setItem(key, fractal.toString());
}

function loadFractal(fract) {
  globalFractalSelector.hide();
  viewFrac.drawnPointsCount = 0;
  viewFrac.resetManual();
  viewForm.resetManual();
  fractal = new Fractal(fract);
  windowResize();
  globalHistory.store();
}

function toggleDisplay(id) {
  const el = document.getElementById(id);
  const newstate = el.style['display'] == 'none';
  el.style['display'] = newstate ? '' : 'none';
  return newstate;
}

function findNearestPoint(points, p, distanceThreshold) {
  function pointDistance(p1, p2) { let dx = p1[0] - p2[0], dy = p1[1] - p2[1]; return dx * dx + dy * dy; }
  let nearestDistance = distanceThreshold, nearestIndex = null;
  for (let i = 0; i < points.length; i++) {
    let d = pointDistance(points[i], p);
    if (d < nearestDistance) { nearestDistance = d; nearestIndex = i; } 
  }
  return nearestIndex;
}