// PaletteEditor

class cPaletteEditor {
  constructor() {
    this.maxx = 0;
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

let paletteEditor = new cPaletteEditor();

function drawPaletteEditor() {
  localStorage.lastpalette = JSON.stringify(paletteKeys);
  const id = 'canvasColor';
  const c  = document.getElementById(id);
  c.width = c.parentElement.clientWidth;
  c.height = c.parentElement.clientHeight;
  const d = 5;
  const h = c.height;
  paletteEditor.setMaxX(c.width);
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.setLineDash([]);
  ctx.lineWidth = 1;
  for (let x = 0; x < c.width; x++) {
    const i = paletteEditor.getIndex(x);
    const rgb = fractalPalette[i];
    const hex = rgbToHex(rgb & 0xff, (rgb >> 8) & 0xff, (rgb >> 16) & 0xff);
    ctx.fillStyle = hex;
    ctx.fillRect(x, 0, x, c.height);
  }
  for (let i in paletteKeys) {
    if (i == selectedColor) {
      ctx.lineWidth = 4;
    }
    else {
      ctx.lineWidth = 1;
    }
    const key = paletteKeys[i];
    const x = paletteEditor.getX(key.index);
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
  viewFrac.setForceRedrawPalette();
  histor.store();
}

function addColor() {
  if (paletteEditor.colorPicker.hidden) return;
  let i = lastSelectedColor;
  if (i == paletteKeys.length - 1) i--;
  addColorAt(((paletteKeys[i].index + paletteKeys[i + 1].index) / 2) | 0);
}

function removeColor() {
  if (paletteEditor.colorPicker.hidden) return;
  if (paletteKeys.length > 2) {
    paletteKeys.splice(lastSelectedColor, 1);
    if (lastSelectedColor > 0) {
      lastSelectedColor--;
    }
    fractalPalette = createPaletteFromKeys(paletteKeys);
    drawPaletteEditor();
    viewFrac.setForceRedrawPalette();
    histor.store();
    }
}

function togglePaletteEditor() {
  if (toggleDisplay('canvasColorDiv')) {
    drawPaletteEditor();
    paletteEditor.colorPicker.hidden = false;
    paletteEditor.buttonAddColor.hidden = false;
    paletteEditor.buttonRemoveColor.hidden = false;
    } 
  else {
    paletteEditor.colorPicker.hidden = true;
    paletteEditor.buttonAddColor.hidden = true;
    paletteEditor.buttonRemoveColor.hidden = true;
    }
}

function initializePaletteEditor() {
  paletteEditor.colorPicker = mainPane.addInput(parameters, 'colorValue', { picker: 'inline', expanded: true }).on('change', () => { 
    let p = paletteKeys[lastSelectedColor];
    p.r = parameters.colorValue.r;
    p.g = parameters.colorValue.g;
    p.b = parameters.colorValue.b;
    fractalPalette = createPaletteFromKeys(paletteKeys);
    drawPaletteEditor();
    viewFrac.setForceRedrawPalette();
    drag.state = 'colorpicker';
  });
  paletteEditor.buttonAddColor = mainPane.addButton({title: 'Add color [A]'}).on('click', addColor);
  paletteEditor.buttonRemoveColor = mainPane.addButton({title: 'Remove color [X]'}).on('click', removeColor);
  paletteEditor.colorPicker.hidden = true;
  paletteEditor.buttonAddColor.hidden = true;
  paletteEditor.buttonRemoveColor.hidden = true;
}