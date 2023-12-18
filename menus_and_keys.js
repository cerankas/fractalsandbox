// Menus and Keys

function toggleMainToolbox() {
  toggleDisplay('mainIconsHidingDiv');
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


function initializeMainToolbox() {
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
}

function initializeUserInterface() {
  initializeMainToolbox();
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
    toggleMainToolbox();
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
