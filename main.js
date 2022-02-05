// Main

function onPointerMove(e) {
  if (e.target.id == 'canvasForm') {
    let mousePoint = globalFractalEditor.fromScreen([e.offsetX, e.offsetY]);
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
      globalFractalEditor.manualShiftx = drag.startPoint[0] + e.offsetX;
      globalFractalEditor.manualShifty = drag.startPoint[1] + e.offsetY;
      resizeFormulas();
      return;
    }
    drawFormulas();
  }
  if (e.target.id == 'canvasFrac' && drag.state == 'viewfrac') {
    globalFractalViewer.manualShiftx = drag.startPoint[0] + e.offsetX;
    globalFractalViewer.manualShifty = drag.startPoint[1] + e.offsetY;
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
    let newIndex = globalPaletteEditor.getIndex(e.screenX - 8);
    if (drag.colorIndex > 0 && newIndex <= paletteKeys[drag.colorIndex - 1].index) {
      newIndex = paletteKeys[drag.colorIndex - 1].index + 1;
    }
    if (drag.colorIndex < paletteKeys.length - 1 && newIndex >= paletteKeys[drag.colorIndex + 1].index) {
      newIndex = paletteKeys[drag.colorIndex + 1].index - 1;
    }
    p.index = newIndex;
    fractalPalette = createPaletteFromKeys(paletteKeys);
    drawPaletteEditor();
    globalFractalViewer.setForceRedrawPalette();
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
      let mousePoint = globalFractalEditor.fromScreen([e.offsetX, e.offsetY]);
      selectNearestFormula(mousePoint);
      if (selectedFormula) {
        drag.state = 'formula';
        drag.startPoint = mousePoint;
        dragFormula = fractal.formulas[selectedFormula.formula].clone();
      }
      if (!selectedFormula) {
        drag.state = 'viewform';
        drag.startPoint[0] = globalFractalEditor.manualShiftx - e.offsetX;
        drag.startPoint[1] = globalFractalEditor.manualShifty - e.offsetY;
      }
    }
    if (rightButton) {
      globalFractalEditor.resetManual();
      resizeFormulas();
    }
  }
  if (e.target.id == 'canvasFrac') {
    if (leftButton) {
      drag.state = 'viewfrac';
      drag.startPoint[0] = globalFractalViewer.manualShiftx - e.offsetX;
      drag.startPoint[1] = globalFractalViewer.manualShifty - e.offsetY;
    }
    if (rightButton) {
      globalFractalViewer.resetManual();
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

function onWindowPointerUp(e) {
  if (drag.state) {
    if (drag.state == 'formula') {
      resizeFormulas();
    }
    if (['formula', 'color', 'colorpicker'].includes(drag.state)) {
      GlobalHistory.store();
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
    zoomView(globalFractalEditor);
    doZoomForm = true;
    //resizeFormulas();
  }
  if (e.target.id == 'canvasFrac') {
    zoomView(globalFractalViewer);
    doZoomFrac = true;
  }
}

function resizeFormulas(view = globalFractalEditor) {
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
  globalFractalViewer.prepare(fractal);
}

function computeInBackground() {
  if (doZoomFrac) {
    globalFractalViewer.prepare(fractal);
    doZoomFrac = false;
  }
  if (globalFractalSelector.active) {
    globalFractalSelector.computeInBackground();
  }
  else {
    if (globalFractalViewer.fractalString != fractal.toString()) {
      globalFractalViewer.prepare(fractal);
      localStorage.lastFractal = globalFractalViewer.fractalString;
    }
    globalFractalViewer.draw();
  }
  if (doZoomForm) {
    resizeFormulas();
    doZoomForm = false;
  }
  setTimeout(computeInBackground,1);
}

function jsMain() {
  window.addEventListener('pointermove', onWindowPointerMove);
  window.addEventListener('pointerup', onWindowPointerUp);

  window.addEventListener('resize', windowResize);
  window.addEventListener('keypress', windowKeyPress);
  document.addEventListener('keydown', documentKeyDown);

  globalFractalSelector = new FractalSelector();
  globalFractalViewer = new FractalViewer(setupCanvas('canvasFrac'));
  globalFractalEditor = new Viewport(setupCanvas('canvasForm'), .6);
  globalPaletteEditor = new PaletteEditor(setupCanvas('canvasColor'));

  initializePalette();
  
  const initFract = '-.653 .458 .270 .685 .374 .513#-.151 -.382 -.123 .239 .278 .426#.051 -.434 -.067 -.211 .597 .689#-.047 .725 .183 .147 .023 .231'; // fern fractal
  loadFractal(localStorage.lastFractal || initFract);
  computeInBackground();

  initializeMainPane();
  initializeLoadPane();

  initializePaletteEditorPane();
}

window.onload = jsMain;
