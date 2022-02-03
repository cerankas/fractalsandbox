// Tweakpane

let mainPane, loadPane;
//let userPane, userButton, sessionId;

const parameters = {
  balanceFactor: 1,

  //email: '',
  //password: '',
  //nickname: '',

  tileSize: 200,
  tileDetail: 10,

  formulaIndex: 1,

  colorIndex: 1,
  colorValue: {r: 0, g:0 , b: 0},
  colorPosition: 3,
};

function toggleMainPane() {
  mainPane.hidden = ~mainPane.hidden;
}

function initializeMainPane() {
  mainPane = new Tweakpane.Pane({container: document.getElementById("mainPaneDiv")});
  mainPane.addButton({title: 'Hide menu [M]'}).on('click', () => { toggleMainPane(); });
  mainPane.addButton({title: 'Load fractal [L]'}).on('click', () => { fractalSelector.show(); });
  mainPane.addButton({title: 'Save fractal [S]'}).on('click', saveFractal);
  mainPane.addButton({title: 'Download image [D]'}).on('click', downloadImage);
  //mainPane.addButton({title: 'Download movie [V]'}).on('click', downloadMovie);
  mainPane.addButton({title: 'Undo [Z]'}).on('click', () => { histor.back(); });
  mainPane.addButton({title: 'Redo [Y]'}).on('click', () => { histor.forward(); });
  mainPane.addButton({title: 'Add triangle [+]'}).on('click', addFormula);
  mainPane.addButton({title: 'Remove triangle [-]'}).on('click', () => { removeFormula(lastSelectedFormula); });
  mainPane.addInput(parameters, 'balanceFactor', { label: 'Total balance', min: .1, max: 3, step: .01 }).on('change', drawMainFractal);
  mainPane.addButton({title: 'Draw infinitely [I]'}).on('click', () => { viewFrac.infinite = !viewFrac.infinite; });
  mainPane.addButton({title: 'Edit colors [C]'}).on('click', toggleColorEditor);
}

function initializeLoadPane() {
  loadPane = new Tweakpane.Pane({container: document.getElementById("loadPaneDiv")});
  loadPane.addButton({title: 'Cancel [L]'}).on('click', () => { fractalSelector.hide(); });
  loadPane.addInput(parameters, 'tileSize', { label: 'Tile size', min: 50, max: 500, step: 1 }).on('change', () => { fractalSelector.update(); });
  loadPane.addInput(parameters, 'tileDetail', { label: 'Tile detail', min: 1, max: 10, step: 1 }).on('change', () => { fractalSelector.update(); });
}

function initializeUserPane() {
  //userPane = new Tweakpane.Pane();
  //userPane.hidden = true;
  //mainPane.addInput(parameters, 'email');
  //mainPane.addInput(parameters, 'password');
  //mainPane.addInput(parameters, 'nickname');
  //mainPane.addButton({title: 'login'}).on('click', () => { sendXHR('action=login&email=' + parameters.email + '&password=' + parameters.password); });
  //mainPane.addButton({title: 'logout'}).on('click', () => { sendXHR('action=logout'); });
  //mainPane.addButton({title: 'register'}).on('click', () => { sendXHR('action=register&email=' + parameters.email + '&password=' + parameters.password + '&nickname=' + parameters.nickname); });
  //mainPane.addButton({title: 'reset password'}).on('click', () => { sendXHR('action=reset&email=' + parameters.email); });
}

function documentKeyDown(e) {
  if (e.keyCode == 27) { // Esc
    if (drag.state == 'formula') {
      drag.state = false;
      fractal.formulas[selectedFormula.formula] = dragFormula;
      drawFormulas();
    }
    if (fractalSelector.active) {
      fractalSelector.hide();
    }
  }
}

function windowKeyPress(e) {
  const c = String.fromCharCode(e.keyCode);
  if (c == 'm') {
    toggleMainPane();
  }
  if (c == 'l') {
    if (!fractalSelector.active) { fractalSelector.show(); } else { fractalSelector.hide(); }
  }
  if (c == 's') {
    saveFractal();
  }
  if (c == 'd') {
    downloadImage();
  }
  if (c == 'z') {
    histor.back();
  }
  if (c == 'y') {
    histor.forward();
  }
  if (c == '+' || c == '=') {
    addFormula();
  }
  if (c == '-') {
    removeFormula(selectedFormula);
  }
  if (c == 'i') {
    viewFrac.infinite = !viewFrac.infinite;
  }
  if (c == 'c') {
    toggleColorEditor();
  }
  if (c == 'a') {
    addColor();
  }
  if (c == 'x') {
    removeColor();
  }
}
