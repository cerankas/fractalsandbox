// Utils

function getMilliseconds() { return Number(new Date()); }

/*function memoryTest() {
  const memoryTestStepSize = 100 * 1000 * 1000;
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
  const key = 'fractal#' + new Date().toISOString();
  localStorage.setItem(key, globalFractalEditor.formulas.toString());
}

function loadFractal(fract) {
  globalFractalSelector.hide();
  globalFractalViewer.resetManual();
  globalFractalEditor.resetManual();
  globalFractalEditor.formulas = new Fractal(fract).formulas;
  windowResize();
  GlobalHistory.store();
}

function toggleDisplay(id) {
  const el = document.getElementById(id);
  const newstate = el.style['display'] == 'none';
  el.style['display'] = newstate ? '' : 'none';
  return newstate;
}

function getCanvasCtx(id) {
  return document.getElementById(id).getContext('2d');
}

function findNearestPoint(points, point, distanceThreshold) {
  function pointDistanceSquared(p1, p2) { 
    const delta = subtractVectors(p1, p2);
    return delta[0] * delta[0] + delta[1] * delta[1];
  }
  let nearestDistance = distanceThreshold * distanceThreshold;
  let nearestIndex = null;
  for (let i = 0; i < points.length; i++) {
    const distance = pointDistanceSquared(points[i], point);
    if (distance < nearestDistance) { nearestDistance = distance; nearestIndex = i; } 
  }
  return nearestIndex;
}

function getEventClientXY(e) {
  return [
    e.offsetX,
    e.offsetY
  ];
}

function getEventScreenXY(e) {
  return [
    e.screenX,
    e.screenY
  ];
}

function addVectors(v1, v2) {
  return [
    v1[0] + v2[0],
    v1[1] + v2[1]
  ];
}

function subtractVectors(v1, v2) {
  return [
    v1[0] - v2[0],
    v1[1] - v2[1]
  ];
}

function multiplyVector(v, s) { 
  return [
    v[0] * s, 
    v[1] * s
  ]; 
}
