// Main

import * as util from './util.js'
import glob from './global.js';
import Drag from './drag.js';
import History from './history.js';
import FractalSelector from './fractal_selector.js';
import FractalViewer from './fractal_viewer.js';
import FractalEditor from './fractal_editor.js';
import PaletteEditor from './palette_editor.js';
import Formula from './formula.js';
import * as pal from './palette.js'
import { initializeUserInterface, toggleMainToolbox } from './menus_and_keys.js';
import { onColorPickerInput, onColorPickerChange} from './color_picker.js';

window.toggleMainToolbox = toggleMainToolbox;
window.onColorPickerInput = onColorPickerInput;
window.onColorPickerChange = onColorPickerChange;

export function windowResize() {
  function setWidthHeight(obj, width, height) { 
    const canvas = obj.ctx.canvas;
    if (canvas.width  != width)  canvas.width = width; 
    if (canvas.height != height) canvas.height = height; 
  }
  let width  = window.innerWidth;
  let height = window.innerHeight;
  if (width > height) width /= 2;
  else height /= 2;
  setWidthHeight(glob.FractalViewer, width, height);
  setWidthHeight(glob.FractalEditor, width, height);
  glob.FractalViewer.viewChanged = true;
  glob.FractalEditor.resizeFormulas();
  glob.PaletteEditor.mustRedraw = true;
}

function processInBackground() {
  if (glob.FractalSelector.active) {
    glob.FractalSelector.processInBackground();
  }
  else {

    const fractalString = Formula.formulasToString(glob.FractalEditor.formulas);
    const paletteString = pal.paletteKeysToString(glob.PaletteEditor.paletteKeys);

    if (glob.FractalViewer.fractalString != fractalString || glob.FractalViewer.viewChanged) {
      glob.FractalViewer.fractalString = fractalString;
      glob.FractalViewer.viewChanged = false;
      glob.FractalViewer.setFormulas(glob.FractalEditor.formulas);
    }

    if (glob.FractalViewer.paletteString != paletteString) {
      glob.FractalViewer.paletteString = paletteString;
      glob.FractalViewer.setPalette(glob.PaletteEditor.palette);
    }

    glob.FractalViewer.processInBackground();

    if (!glob.Drag.isDragging()) {
      localStorage.lastFractal = fractalString;
      localStorage.lastPalette = paletteString;
      glob.History.store({ fractal: fractalString, palette: paletteString });
    }

    if (glob.FractalEditor.fractalString != fractalString || glob.FractalEditor.viewChanged) {
      glob.FractalEditor.fractalString = fractalString;
      glob.FractalEditor.viewChanged = false;
      glob.FractalEditor.draw();
    }

    if (glob.PaletteEditor.paletteString != paletteString || glob.PaletteEditor.mustRedraw) {
      glob.PaletteEditor.paletteString = paletteString;
      glob.PaletteEditor.mustRedraw = false;
      glob.PaletteEditor.draw();
    }

  }
  setTimeout(processInBackground,1);
}

function onRestoreHistoryItem(item) {
  glob.PaletteEditor.loadPalette(item.palette);
  loadFractal(item.fractal);
  windowResize();
}

function jsMain() {
  window.glob = glob;
  glob.Drag = new Drag();
  glob.History = new History(onRestoreHistoryItem);

  glob.FractalSelector = new FractalSelector(document.getElementById('fractalSelectorDiv'));
  glob.FractalViewer = new FractalViewer(util.getCanvasCtx('canvasFrac')).registerEventListeners();
  glob.FractalEditor = new FractalEditor(util.getCanvasCtx('canvasForm'));
  glob.PaletteEditor = new PaletteEditor(util.getCanvasCtx('canvasColor'));

  glob.FractalViewer.displayStats = true;
  glob.PaletteEditor.loadPalette(localStorage.lastPalette);

  const fernFractal = '-.653 .458 .270 .685 .374 .513#-.151 -.382 -.123 .239 .278 .426#.051 -.434 -.067 -.211 .597 .689#-.047 .725 .183 .147 .023 .231';
  util.loadFractal(localStorage.lastFractal || fernFractal);
  windowResize();
  processInBackground();

  initializeUserInterface();
}

window.onload = jsMain;
