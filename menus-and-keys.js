// Menus and Keys

function toggleMainMenu() {
  toggleDisplay('mainIconsHidingDiv');
}

function toggleMainPane() {
  mainPane.hidden = ~mainPane.hidden;
}

function selectFractal() {
  globalFractalSelector.show();
}

function historyBack() {
  globalHistory.back();
}

function historyForward() {
  globalHistory.forward();
}

function addTriangle() {
  globalFractalEditor.addFormula();
}

function removeTriangle() {
  globalFractalEditor.removeFormula();
}

function drawInfinitely() {
  globalFractalViewer.infinite = !globalFractalViewer.infinite;
}

function editColors() {
  globalPaletteEditor.toggle();
}


function initializeMainPane() {
  function addMainMenuIcon(name, onclick, tooltip) {
    const menuDiv = document.getElementById("mainIconsHidingDiv");
    const icon = document.createElement('i');
    icon.className = 'icon-main icon-' + name;
    icon.onclick = onclick;
    if (tooltip) {
      const tooltipText = document.createElement('span');
      tooltipText.className = 'tooltiptext';
      tooltipText.innerHTML = tooltip;
      const tooltipContainer = document.createElement('div');
      tooltipContainer.className = 'tooltip';
      tooltipContainer.appendChild(icon);
      tooltipContainer.appendChild(tooltipText);
      menuDiv.appendChild(tooltipContainer);
    }
    else {
      menuDiv.appendChild(icon);
    }
    menuDiv.appendChild(document.createTextNode(' '));
  }
  function addMainMenuSeparator() {
    const menuDiv = document.getElementById("mainIconsHidingDiv");
    const node = document.createElement('span');
    node.innerHTML = '&nbsp;';
    menuDiv.appendChild(node);
  }

  addMainMenuIcon('download-cloud', selectFractal, 'Load fractal [L]');
  addMainMenuIcon('upload-cloud', saveFractal, 'Save fractal [S]');
  addMainMenuIcon('picture', downloadImage, 'Download image [D]');
  addMainMenuSeparator();
  addMainMenuIcon('reply', historyBack, 'Undo [Z]');
  addMainMenuIcon('forward', historyForward, 'Redo [Y]');
  addMainMenuSeparator();
  addMainMenuIcon('plus-squared-alt', addTriangle, 'Add triangle [+]');
  addMainMenuIcon('minus-squared-alt', removeTriangle, 'Remove triangle [-]');
  addMainMenuSeparator();
  addMainMenuIcon('infinity', drawInfinitely, 'Draw infinitely [I]');
  addMainMenuIcon('brush', editColors, 'Edit colors [C]');
  addMainMenuSeparator();

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
  toggleMainPane();
}

function initializeLoadPane() {
  loadPane = new Tweakpane.Pane({container: document.getElementById("loadPaneDiv")});
  loadPane.addButton({title: 'Cancel [L]'}).on('click', () => { globalFractalSelector.hide(); });
  loadPane.addInput(globalFractalSelector, 'tileSize', { label: 'Tile size', min: 50, max: 500, step: 1 }).on('change', () => { globalFractalSelector.update(); });
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
  if (c == 't') {
    toggleMainMenu();
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
