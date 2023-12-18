// Menus and Keys

import * as util from './util.js'
import glob from './global.js'
import { windowResize } from './main.js';

export function toggleMainToolbox() {
  util.toggleDisplay('mainIconsHidingDiv');
}

window.toggleMainToolbox = toggleMainToolbox;

function selectFractal() {
  glob.FractalSelector.show();
}

function historyBack() {
  glob.History.back();
}

function historyForward() {
  glob.History.forward();
}

function addTriangle() {
  glob.FractalEditor.addFormula();
}

function removeTriangle() {
  glob.FractalEditor.removeFormula();
}

function drawInfinitely() {
  glob.FractalViewer.infinite = !glob.FractalViewer.infinite;
}

function editColors() {
  glob.PaletteEditor.toggle();
}


export function initializeMainToolbox() {
  function addMainMenuIcon(name, onclick, tooltip) {
    const menuDiv = document.getElementById("mainIconsHidingDiv");
    const icon = document.createElement('i');
    icon.className = 'icon-main icon-' + name;
    icon.addEventListener('click',onclick);
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
  addMainMenuIcon('upload-cloud', util.saveFractal, 'Save fractal [S]');
  addMainMenuIcon('picture', util.downloadImage, 'Download image [D]');
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

export function initializeUserInterface() {
  initializeMainToolbox();
  window.addEventListener('resize', windowResize);
  window.addEventListener('keypress', windowKeyPress);
  document.addEventListener('keydown', documentKeyDown);
}


function documentKeyDown(e) {
  if (e.keyCode == 27) { // Esc
    if (glob.FractalSelector.active) { glob.FractalSelector.hide(); return; }
  }
}

function windowKeyPress(e) {
  const c = String.fromCharCode(e.keyCode);
  if (c == 't') {
    toggleMainToolbox();
  }
  if (c == 'l') {
    if (!glob.FractalSelector.active) { glob.FractalSelector.show(); } else { glob.FractalSelector.hide(); }
  }
  if (c == 's') {
    util.saveFractal();
  }
  if (c == 'd') {
    util.downloadImage();
  }
  if (c == 'z') {
    glob.History.back();
  }
  if (c == 'y') {
    glob.History.forward();
  }
  if (c == '+' || c == '=') {
    glob.FractalEditor.addFormula();
  }
  if (c == '-') {
    glob.FractalEditor.removeFormula();
  }
  if (c == 'i') {
    glob.FractalViewer.infinite = !glob.FractalViewer.infinite;
  }
  if (c == 'c') {
    glob.PaletteEditor.toggle();
  }
  if (c == 'a') {
    glob.PaletteEditor.addColor();
  }
  if (c == 'x') {
    glob.PaletteEditor.removeColor();
  }
}
