// PaletteEditor

class PaletteEditor {
  constructor(ctx) {
    this.ctx = ctx;
    this.maxx = 0;
    this.colorValue = {r: 0, g:0 , b: 0};
    this.colorPosition = 3;
  }
  setMaxX(maxx) {
    this.maxx = maxx;
  }
  getX(i) {
    return  (this.maxx + 1) * i / FRACTAL_PALETTE_LENGTH;
  }
  getIndex(x) {
    if (x < 0) x = 0;
    if (x >= this.maxx) x = this.maxx;
    return (x * FRACTAL_PALETTE_LENGTH / (this.maxx + 1)) | 0;
  }
}

function drawPaletteEditor() {
  localStorage.lastpalette = JSON.stringify(paletteKeys);
  const id = 'canvasColor';
  const c  = document.getElementById(id);
  c.width = c.parentElement.clientWidth;
  c.height = c.parentElement.clientHeight;
  const d = 5;
  const h = c.height;
  globalPaletteEditor.setMaxX(c.width);
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.setLineDash([]);
  ctx.lineWidth = 1;
  for (let x = 0; x < c.width; x++) {
    const i = globalPaletteEditor.getIndex(x);
    const rgb = fractalPalette[i];
    const hex = rgbToHex(rgb & 0xff, (rgb >> 8) & 0xff, (rgb >> 16) & 0xff);
    ctx.fillStyle = hex;
    ctx.fillRect(x, 0, x, c.height);
  }
  for (let i = 0; i < paletteKeys.length; i++) {
    if (i == selectedColor) {
      ctx.lineWidth = 4;
    }
    else {
      ctx.lineWidth = 1;
    }
    const key = paletteKeys[i];
    const x = globalPaletteEditor.getX(key.index);
    const rgb = key.r + key.g + key.b;
    ctx.beginPath();
    ctx.strokeStyle = rgb > 1.5 * 0xff ? 'black' : 'white';
    ctx.moveTo(x - d, 0);
    ctx.lineTo(x, d);
    ctx.lineTo(x + d, 0);
    ctx.stroke();
  }
}

function addColorAt(index) {
  let i = 0;
  while (i < paletteKeys.length - 1 && paletteKeys[i].index < index) i++;
  const rgb = fractalPalette[index];
  paletteKeys.splice(i, 0, new cPaletteKey(index, rgb & 0xff, (rgb >> 8) & 0xff, (rgb >> 16) & 0xff));
  fractalPalette = createPaletteFromKeys(paletteKeys);
  drawPaletteEditor();
  globalFractalViewer.setForceRedrawPalette();
  GlobalHistory.store();
}

function addColor() {
  if (globalPaletteEditor.colorPicker.hidden) return;
  let i = lastSelectedColor;
  if (i == paletteKeys.length - 1) i--;
  addColorAt(((paletteKeys[i].index + paletteKeys[i + 1].index) / 2) | 0);
}

function removeColor() {
  if (globalPaletteEditor.colorPicker.hidden) return;
  if (paletteKeys.length > 2) {
    paletteKeys.splice(lastSelectedColor, 1);
    if (lastSelectedColor > 0) {
      lastSelectedColor--;
    }
    fractalPalette = createPaletteFromKeys(paletteKeys);
    drawPaletteEditor();
    globalFractalViewer.setForceRedrawPalette();
    GlobalHistory.store();
    }
}

function togglePaletteEditor() {
  if (toggleDisplay('canvasColorDiv')) {
    drawPaletteEditor();
    globalPaletteEditor.colorPicker.hidden = false;
    globalPaletteEditor.buttonAddColor.hidden = false;
    globalPaletteEditor.buttonRemoveColor.hidden = false;
    } 
  else {
    globalPaletteEditor.colorPicker.hidden = true;
    globalPaletteEditor.buttonAddColor.hidden = true;
    globalPaletteEditor.buttonRemoveColor.hidden = true;
    }
}

function selectNearestColor(p) {
  const points = [];
  for (let key of paletteKeys) {
    points.push([globalPaletteEditor.getX(key.index), 10]);
  }
  selectedColor = findNearestPoint(points, p, 100);
  if (selectedColor != null) {
    lastSelectedColor = selectedColor;
    globalPaletteEditor.colorValue = paletteKeys[selectedColor];
    //const state = drag.state;
    globalPaletteEditor.colorPicker.refresh();
    //drag.state = state;
  }
}

function initializePaletteEditorPane() {
  globalPaletteEditor.colorPicker = mainPane.addInput(globalPaletteEditor, 'colorValue', { picker: 'inline', expanded: true }).on('change', () => { 
    let p = paletteKeys[lastSelectedColor];
    p.r = globalPaletteEditor.colorValue.r;
    p.g = globalPaletteEditor.colorValue.g;
    p.b = globalPaletteEditor.colorValue.b;
    fractalPalette = createPaletteFromKeys(paletteKeys);
    drawPaletteEditor();
    globalFractalViewer.setForceRedrawPalette();
    GlobalDrag.dragOwner = globalPaletteEditor;
  });
  globalPaletteEditor.buttonAddColor = mainPane.addButton({title: 'Add color [A]'}).on('click', addColor);
  globalPaletteEditor.buttonRemoveColor = mainPane.addButton({title: 'Remove color [X]'}).on('click', removeColor);
  globalPaletteEditor.colorPicker.hidden = true;
  globalPaletteEditor.buttonAddColor.hidden = true;
  globalPaletteEditor.buttonRemoveColor.hidden = true;
}
