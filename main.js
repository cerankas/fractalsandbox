// Main

function onPointerMove(e) {
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
      globalFractalEditor.resizeFormulas();
    }
    if (['formula', 'color', 'colorpicker'].includes(drag.state)) {
      GlobalHistory.store();
    }
    drag.state = false;
  }
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
  globalFractalEditor.resizeFormulas();
  drawPaletteEditor();
}

function drawMainFractal() {
  globalFractalViewer.prepare(globalFractalEditor.formulas);
}

function computeInBackground() {
  if (globalFractalViewer.doZoom) {
    globalFractalViewer.prepare(globalFractalEditor.formulas);
    globalFractalViewer.doZoom= false;
  }
  if (globalFractalSelector.active) {
    globalFractalSelector.computeInBackground();
  }
  else {
    if (globalFractalViewer.fractalString != globalFractalEditor.formulas.toString()) {
      globalFractalViewer.prepare(globalFractalEditor.formulas);
      //localStorage.lastFractal = globalFractalViewer.fractalString;
    }
    globalFractalViewer.draw();
  }
  if (globalFractalEditor.doZoom) {
    globalFractalEditor.resizeFormulas();
    globalFractalEditor.doZoom = false;
  }
  setTimeout(computeInBackground,1);
}

function jsMain() {
  //window.addEventListener('pointermove', onWindowPointerMove);
  //window.addEventListener('pointerup', onWindowPointerUp);

  window.addEventListener('resize', windowResize);
  window.addEventListener('keypress', windowKeyPress);
  document.addEventListener('keydown', documentKeyDown);

  globalFractalSelector = new FractalSelector(document.getElementById('fractalSelectorDiv'));
  globalFractalViewer = new FractalViewer(getCanvasCtx('canvasFrac'));
  globalFractalEditor = new FractalEditor(getCanvasCtx('canvasForm'));
  globalPaletteEditor = new PaletteEditor(getCanvasCtx('canvasColor'));

  initializePalette();
  
  const initFract = '-.653 .458 .270 .685 .374 .513#-.151 -.382 -.123 .239 .278 .426#.051 -.434 -.067 -.211 .597 .689#-.047 .725 .183 .147 .023 .231'; // fern fractal
  loadFractal(localStorage.lastFractal || initFract);
  computeInBackground();

  initializeMainPane();
  initializeLoadPane();

  initializePaletteEditorPane();
}

window.onload = jsMain;
