// Main

function windowResize() {
  function setWidthHeight(obj, width, height) { 
    const canvas = obj.ctx.canvas;
    if (canvas.width  != width)  canvas.width = width; 
    if (canvas.height != height) canvas.height = height; 
  }
  let width  = window.innerWidth;
  let height = window.innerHeight;
  if (width > height) width /= 2;
  else height /= 2;
  setWidthHeight(globalFractalViewer, width, height);
  setWidthHeight(globalFractalEditor, width, height);
  if (false) {
    if (width > height) {
      setWidthHeight(globalFractalViewer, height, height);
      setWidthHeight(globalFractalEditor, width - height, height);
    }
    else {
      setWidthHeight(globalFractalViewer, width, width);
      setWidthHeight(globalFractalEditor, width, height - width);
    }
  }
  globalFractalViewer.updateTransform();
  globalFractalViewer.viewChanged = true;
  globalFractalEditor.resizeFormulas();
  globalPaletteEditor.draw();
}

function processInBackground() {
  if (globalFractalSelector.active) {
    globalFractalSelector.processInBackground();
  }
  else {
    const fractalString = formulasToString(globalFractalEditor.formulas);
    const paletteString = paletteKeysToString(globalPaletteEditor.paletteKeys);
    if (globalFractalViewer.fractalString != fractalString || globalFractalViewer.viewChanged) {
      globalFractalViewer.fractalString = fractalString;
      globalFractalViewer.viewChanged = false;
      globalFractalViewer.setFormulas(globalFractalEditor.formulas);
    }
    if (globalFractalViewer.paletteString != paletteString) {
      globalFractalViewer.paletteString = paletteString;
      globalFractalViewer.setPalette(globalPaletteEditor.palette);
    }
    globalFractalViewer.processInBackground();
    if (!globalDrag.isDragging()) {
      localStorage.lastFractal = fractalString;
      localStorage.lastPalette = paletteString;
      globalHistory.store({ fractal: fractalString, palette: paletteString });
    }
    if (globalFractalEditor.fractalString != fractalString || globalFractalEditor.viewChanged) {
      globalFractalEditor.fractalString = fractalString;
      globalFractalEditor.viewChanged = false;
      globalFractalEditor.draw();
    }
    if (globalPaletteEditor.paletteString != paletteString || globalPaletteEditor.mustRedraw) {
      globalPaletteEditor.paletteString = paletteString;
      globalPaletteEditor.mustRedraw = false;
      globalPaletteEditor.draw();
    }
  }
  setTimeout(processInBackground,1);
}

function onRestoreHistoryItem(item) {
  globalFractalEditor.formulas = formulasFromString(item.fractal);
  globalPaletteEditor.loadPalette(item.palette);
  windowResize();
}

function jsMain() {
  globalDrag = new Drag();
  globalHistory = new History(onRestoreHistoryItem);

  globalFractalSelector = new FractalSelector(document.getElementById('fractalSelectorDiv'));
  globalFractalViewer = new FractalViewer(getCanvasCtx('canvasFrac')).registerEventListeners();
  globalFractalEditor = new FractalEditor(getCanvasCtx('canvasForm'));
  globalPaletteEditor = new PaletteEditor(getCanvasCtx('canvasColor'));
  
  globalPaletteEditor.loadPalette(localStorage.lastPalette);

  const fernFractal = '-.653 .458 .270 .685 .374 .513#-.151 -.382 -.123 .239 .278 .426#.051 -.434 -.067 -.211 .597 .689#-.047 .725 .183 .147 .023 .231';
  loadFractal(localStorage.lastFractal || fernFractal);
  windowResize();
  processInBackground();

  initializeUserInterface();
}

window.onload = jsMain;
