// Main

function findNearestPoint(points, p, distanceThreshold) {
  function pointDistance(p1, p2) { let dx = p1[0] - p2[0], dy = p1[1] - p2[1]; return dx * dx + dy * dy; }
  let nearestDistance = distanceThreshold, nearestIndex = null;
  for (let i = 0; i < points.length; i++) {
    let d = pointDistance(points[i], p);
    if (d < nearestDistance) { nearestDistance = d; nearestIndex = i; } 
  }
  return nearestIndex;
}

function selectNearestFormula(p) {
  const nearestIndex = findNearestPoint(fractal.formulaPoints(), p, 10 / viewForm.scale);
  selectedFormula = (nearestIndex != null) ? fractal.formulaSelections()[nearestIndex] : null;
  if (selectedFormula) {
    lastSelectedFormula = fractal.formulaSelections()[nearestIndex];
  }
}

function selectNearestColor(p) {
  const points = [];
  for (let key of paletteKeys) {
    points.push([paletteEditor.getX(key.index), 10]);
  }
  selectedColor = findNearestPoint(points, p, 1000);
  if (selectedColor != null) {
    lastSelectedColor = selectedColor;
    parameters.colorValue = paletteKeys[selectedColor];
    const state = drag.state;
    paletteEditor.colorPicker.refresh();
    drag.state = state;
  }
}

function onPointerMove(e) {
  if (e.target.id == 'canvasForm') {
    let mousePoint = viewForm.fromScreen([e.offsetX, e.offsetY]);
    if (!drag.state) {
      selectNearestFormula(mousePoint);
    } 
    if (drag.state == 'formula') {
      fractal.formulas[selectedFormula.formula] = dragFormula.clone();
      let dx = mousePoint[0] - drag.startPoint[0];
      let dy = mousePoint[1] - drag.startPoint[1];
      fractal.formulas[selectedFormula.formula].setPoint(dx,dy,selectedFormula.point);
    }
    if (drag.state == 'viewform') {
      viewForm.manualShiftx = drag.startPoint[0] + e.offsetX;
      viewForm.manualShifty = drag.startPoint[1] + e.offsetY;
      resizeFormulas();
      return;
    }
    drawFormulas();
  }
  if (e.target.id == 'canvasFrac' && drag.state == 'viewfrac') {
    viewFrac.manualShiftx = drag.startPoint[0] + e.offsetX;
    viewFrac.manualShifty = drag.startPoint[1] + e.offsetY;
    drawMainFractal();
  }
  if (e.target.id == 'canvasColor' && !drag.state) {
    selectNearestColor([e.offsetX, e.offsetY]);
    drawPaletteEditor();
  }
}

function onWindowPointerMove(e) {
  if (drag.state == 'color') {
    const p = paletteKeys[drag.colorIndex];
    let newIndex = paletteEditor.getIndex(e.screenX - 8);
    if (drag.colorIndex > 0 && newIndex <= paletteKeys[drag.colorIndex - 1].index) {
      newIndex = paletteKeys[drag.colorIndex - 1].index + 1;
    }
    if (drag.colorIndex < paletteKeys.length - 1 && newIndex >= paletteKeys[drag.colorIndex + 1].index) {
      newIndex = paletteKeys[drag.colorIndex + 1].index - 1;
    }
    p.index = newIndex;
    fractalPalette = createPaletteFromKeys(paletteKeys);
    drawPaletteEditor();
    viewFrac.setForceRedrawPalette();
  }
  if (drag.state && e.buttons == 0) {
    drag.state = false;
  }
}

function onPointerDown(e) {
  const leftButton = e.button == 0;
  const rightButton = e.button == 2;
  if (e.target.id == 'canvasForm') {
    if (leftButton) {
      let mousePoint = viewForm.fromScreen([e.offsetX, e.offsetY]);
      selectNearestFormula(mousePoint);
      if (selectedFormula) {
        drag.state = 'formula';
        drag.startPoint = mousePoint;
        dragFormula = fractal.formulas[selectedFormula.formula].clone();
      }
      if (!selectedFormula) {
        drag.state = 'viewform';
        drag.startPoint[0] = viewForm.manualShiftx - e.offsetX;
        drag.startPoint[1] = viewForm.manualShifty - e.offsetY;
      }
    }
    if (rightButton) {
      viewForm.resetManual();
      resizeFormulas();
    }
  }
  if (e.target.id == 'canvasFrac') {
    if (leftButton) {
      drag.state = 'viewfrac';
      drag.startPoint[0] = viewFrac.manualShiftx - e.offsetX;
      drag.startPoint[1] = viewFrac.manualShifty - e.offsetY;
    }
    if (rightButton) {
      viewFrac.resetManual();
      drawMainFractal();
    }
  }
  if (e.target.id == 'canvasColor') {
    if (leftButton) {
      selectNearestColor([e.offsetX, e.offsetY]);
      if (selectedColor != null) {
        drag.state = 'color';
        drag.colorIndex = selectedColor;
      }
    }
  }
}

function onPointerUp(e) {
  if (drag.state) {
    if (drag.state == 'formula') {
      resizeFormulas();
    }
    if (['formula', 'color', 'colorpicker'].includes(drag.state)) {
      globalHistory.store();
    }
    drag.state = false;
  }
}

function onWheel(e) {
  function zoomView(view) {
    let p0 = view.fromScreen([e.offsetX, e.offsetY]);
    view.manualScale *= delta;
    view.updateTransform();
    let p = view.toScreen(p0);
    view.manualShiftx += e.offsetX - p[0];
    view.manualShifty += e.offsetY - p[1];
    view.updateTransform();
  }
  let delta = (e.deltaY < 0) ? 1.1 : 1 / 1.1;
  if (e.target.id == 'canvasForm') {
    zoomView(viewForm);
    doZoomForm = true;
    //resizeFormulas();
  }
  if (e.target.id == 'canvasFrac') {
    zoomView(viewFrac);
    doZoomFrac = true;
  }
}

function resizeFormulas(view = viewForm) {
  if (view.manualScale == 1 && view.manualShiftx == 0 && view.manualShifty == 0) {
    let points = fractal.formulaPoints().concat([[-1, -1], [1, 1]]);
    let minMax = getBoundingBoxFrom2DArray(points);
    view.setMinMax(minMax);
  }
  else {
    view.updateTransform();
  }
  drawFormulas(view);
}

function setupCanvas(id) {
  const c = document.getElementById(id);
  c.onpointermove = onPointerMove;
  c.onpointerdown = onPointerDown;
  c.addEventListener('wheel', onWheel, {passive:true});
  c.oncontextmenu = () => {return false};
  return document.getElementById(id).getContext('2d');
}

function windowResize() {
  function setWidthHeight(id, width, height) { 
    const el = document.getElementById(id);
    if (el.width != width)   el.width = width; 
    if (el.height != height) el.height = height; 
  }
  let width = window.innerWidth;
  let height = window.innerHeight;
  if (width > height) 
    width /= 2; 
  else 
    height /= 2;
  setWidthHeight('canvasFrac', width, height);
  setWidthHeight('canvasForm', width, height);
  drawMainFractal();
  resizeFormulas();
  drawPaletteEditor();
}

function drawMainFractal() {
  viewFrac.prepare(fractal);
}

function computeInBackground() {
  if (doZoomFrac) {
    viewFrac.prepare(fractal);
    doZoomFrac = false;
  }
  if (fractalSelector.active) {
    fractalSelector.computeInBackground();
  }
  else {
    if (viewFrac.fractalString != fractal.toString()) {
      viewFrac.prepare(fractal);
      localStorage.lastFractal = viewFrac.fractalString;
    }
    viewFrac.draw();
  }
  if (doZoomForm) {
    resizeFormulas();
    doZoomForm = false;
  }
  setTimeout(computeInBackground,1);
}

function downloadImage() {
  document.getElementById('download').href = document.getElementById('canvasFrac').toDataURL('image/png');
  document.getElementById('download').click();
}

function saveFractal() {
  let key = 'fractal#' + new Date().toISOString();
  localStorage.setItem(key, fractal.toString());
}

function loadFractal(fract) {
  fractalSelector.hide();
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

function jsMain() {
  window.addEventListener('pointermove', onWindowPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  window.onresize = windowResize;
  window.onkeypress = windowKeyPress;
  document.onkeydown = documentKeyDown;

  globalHistory = new cHistory();
  paletteEditor = new PaletteEditor();
  fractalSelector = new FractalSelector();

  initializePalette();

  setupCanvas('canvasColor');
  viewFrac = new FractalViewer(setupCanvas('canvasFrac'));
  viewForm = new Viewport(setupCanvas('canvasForm'), .6);
  
  let initFract = '-.653 .458 .270 .685 .374 .513#-.151 -.382 -.123 .239 .278 .426#.051 -.434 -.067 -.211 .597 .689#-.047 .725 .183 .147 .023 .231'; // fern fractal
  loadFractal(localStorage.lastFractal || initFract);
  computeInBackground();

  initializeMainPane();
  initializeLoadPane();

  initializePaletteEditorPaneFunctions();
}

window.onload = jsMain;
