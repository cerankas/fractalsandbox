// Menus and Keys

function toggleMainPane() {
  mainPane.hidden = ~mainPane.hidden;
}

function initializeMainPane() {
  mainPane = new Tweakpane.Pane({container: document.getElementById("mainPaneDiv")});
  mainPane.addButton({title: 'Hide menu [M]'}).on('click', () => { toggleMainPane(); });
  mainPane.addButton({title: 'Load fractal [L]'}).on('click', () => { globalFractalSelector.show(); });
  mainPane.addButton({title: 'Save fractal [S]'}).on('click', saveFractal);
  mainPane.addButton({title: 'Download image [D]'}).on('click', downloadImage);
  mainPane.addButton({title: 'Undo [Z]'}).on('click', () => { globalHistory.back(); });
  mainPane.addButton({title: 'Redo [Y]'}).on('click', () => { globalHistory.forward(); });
  mainPane.addButton({title: 'Add triangle [+]'}).on('click', () => { globalFractalEditor.addFormula(); });
  mainPane.addButton({title: 'Remove triangle [-]'}).on('click', () => { globalFractalEditor.removeFormula(); });
  mainPane.addButton({title: 'Draw infinitely [I]'}).on('click', () => { globalFractalViewer.infinite = !globalFractalViewer.infinite; });
  mainPane.addButton({title: 'Edit colors [C]'}).on('click', () => { globalPaletteEditor.toggle(); });

  globalPaletteEditor.initializePane(mainPane);
}

function initializeLoadPane() {
  loadPane = new Tweakpane.Pane({container: document.getElementById("loadPaneDiv")});
  loadPane.addButton({title: 'Cancel [L]'}).on('click', () => { globalFractalSelector.hide(); });
  loadPane.addInput(globalFractalSelector, 'tileSize', { label: 'Tile size', min: 50, max: 500, step: 1 }).on('change', () => { globalFractalSelector.update(); });
  loadPane.addInput(globalFractalSelector, 'tileDetail', { label: 'Tile detail', min: 1, max: 10, step: 1 }).on('change', () => { globalFractalSelector.update(); });
}

function initializeUserInterface() {
  initializeMainPane();
  initializeLoadPane();

  window.addEventListener('resize', windowResize);
  window.addEventListener('keypress', windowKeyPress);
  document.addEventListener('keydown', documentKeyDown);
}


function documentKeyDown(e) {
  if (e.keyCode == 27) { // Esc
    if (globalFractalSelector.active) { globalFractalSelector.hide(); return; }
  }
}

function windowKeyPress(e) {
  const c = String.fromCharCode(e.keyCode);
  if (c == 'm') {
    toggleMainPane();
  }
  if (c == 'l') {
    if (!globalFractalSelector.active) { globalFractalSelector.show(); } else { globalFractalSelector.hide(); }
  }
  if (c == 's') {
    saveFractal();
  }
  if (c == 'd') {
    downloadImage();
  }
  if (c == 'z') {
    globalHistory.back();
  }
  if (c == 'y') {
    globalHistory.forward();
  }
  if (c == '+' || c == '=') {
    globalFractalEditor.addFormula();
  }
  if (c == '-') {
    globalFractalEditor.removeFormula();
  }
  if (c == 'i') {
    globalFractalViewer.infinite = !globalFractalViewer.infinite;
  }
  if (c == 'c') {
    globalPaletteEditor.toggle();
  }
  if (c == 'a') {
    globalPaletteEditor.addColor();
  }
  if (c == 'x') {
    globalPaletteEditor.removeColor();
  }
}
