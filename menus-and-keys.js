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
  //mainPane.addButton({title: 'Download movie [V]'}).on('click', downloadMovie);
  mainPane.addButton({title: 'Undo [Z]'}).on('click', () => { GlobalHistory.back(); });
  mainPane.addButton({title: 'Redo [Y]'}).on('click', () => { GlobalHistory.forward(); });
  mainPane.addButton({title: 'Add triangle [+]'}).on('click', () => { globalFractalEditor.addFormula(); });
  mainPane.addButton({title: 'Remove triangle [-]'}).on('click', () => { globalFractalEditor.removeFormula(); });
  mainPane.addInput(globalFractalEditor, 'balanceFactor', { label: 'Total balance', min: .1, max: 3, step: .01 }).on('change', drawMainFractal);
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

/*function initializeUserPane() {
  userPane = new Tweakpane.Pane();
  userPane.hidden = true;
  mainPane.addInput(parameters, 'email');
  mainPane.addInput(parameters, 'password');
  mainPane.addInput(parameters, 'nickname');
  mainPane.addButton({title: 'login'}).on('click', () => { sendXHR('action=login&email=' + parameters.email + '&password=' + parameters.password); });
  mainPane.addButton({title: 'logout'}).on('click', () => { sendXHR('action=logout'); });
  mainPane.addButton({title: 'register'}).on('click', () => { sendXHR('action=register&email=' + parameters.email + '&password=' + parameters.password + '&nickname=' + parameters.nickname); });
  mainPane.addButton({title: 'reset password'}).on('click', () => { sendXHR('action=reset&email=' + parameters.email); });
}*/

function documentKeyDown(e) {
  if (e.keyCode == 27) { // Esc
    if (globalFractalSelector.active) { globalFractalSelector.hide(); return; }
    //if (globalPaletteEditor.active) { globalPaletteEditor.hide(); return; }
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
    GlobalHistory.back();
  }
  if (c == 'y') {
    GlobalHistory.forward();
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
