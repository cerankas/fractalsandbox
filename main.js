// Main

function windowResize() {
  function setWidthHeight(obj, width, height) { 
    const canvas = obj.ctx.canvas;
    if (canvas.width  != width)  canvas.width = width; 
    if (canvas.height != height) canvas.height = height; 
  }
  let width  = window.innerWidth;
  let height = window.innerHeight;
  if (width > height) 
    width /= 2; 
  else 
    height /= 2;
  setWidthHeight(globalFractalViewer, width, height);
  setWidthHeight(globalFractalEditor, width, height);
  drawMainFractal();
  globalFractalEditor.resizeFormulas();
  globalPaletteEditor.draw();
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
  window.addEventListener('resize', windowResize);
  window.addEventListener('keypress', windowKeyPress);
  document.addEventListener('keydown', documentKeyDown);

  globalFractalSelector = new FractalSelector(document.getElementById('fractalSelectorDiv'));
  globalFractalViewer = new FractalViewer(getCanvasCtx('canvasFrac'));
  globalFractalEditor = new FractalEditor(getCanvasCtx('canvasForm'));
  globalPaletteEditor = new PaletteEditor(getCanvasCtx('canvasColor'), localStorage.lastpalette);
  
  const initFract = '-.653 .458 .270 .685 .374 .513#-.151 -.382 -.123 .239 .278 .426#.051 -.434 -.067 -.211 .597 .689#-.047 .725 .183 .147 .023 .231'; // fern fractal
  loadFractal(localStorage.lastFractal || initFract);
  computeInBackground();

  initializeMainPane();
  initializeLoadPane();
}

window.onload = jsMain;
