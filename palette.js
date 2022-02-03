// Palette

const fractalPaletteLength = 1000;

function coeffMul(v1, v2, coeff) {
  return v1 * (1 - coeff) + v2 * coeff;
}

function createPaletteFromKeys(keys) {
  function fmul(r, g, b, a) { return (r << 0) + (g << 8) + (b << 16) + (a << 24); }
  keys.sort(function(a, b){if (a.index < b.index) return -1; return a.index > b.index;});
  const palette = [];
  const firstKey = keys[0];
  const lastKey = keys[keys.length - 1];
  for (let i = 0; i <= firstKey.index; i++)
    palette.push(fmul(firstKey.r, firstKey.g, firstKey.b, 0xff));
  for (let i = 1; i < keys.length; i++) {
    const prevKey = keys[i - 1];
    const nextKey = keys[i];
    const indexDifference = nextKey.index - prevKey.index;
    if (indexDifference == 0)
      continue;
    for (let j = prevKey.index + 1; j <= nextKey.index; j++) {
      const coeff = (j - prevKey.index) / indexDifference;
      const r = coeffMul(prevKey.r, nextKey.r, coeff);
      const g = coeffMul(prevKey.g, nextKey.g, coeff);
      const b = coeffMul(prevKey.b, nextKey.b, coeff);
      palette.push(fmul(r, g, b, 0xff));
    }
  }
  for (let i = lastKey.index + 1; i < 1000; i++)
    palette.push(fmul(lastKey.r, lastKey.g, lastKey.b, 0xff));
  return palette;
}

class cPaletteKey {
  constructor(index, r, g, b) {
    this.index = index;
    this.r = r;
    this.g = g;
    this.b = b;
  }
}

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

class cPaletteEditor {
  constructor() {
    this.maxx = 0;
  }
  setMaxX(maxx) {
    this.maxx = maxx;
  }
  getX(i) {
    return  (this.maxx + 1) * i / fractalPaletteLength;
  }
  getIndex(x) {
    if (x < 0) x = 0;
    if (x >= this.maxx) x = this.maxx;
    return (x * fractalPaletteLength / (this.maxx + 1)) | 0;
  }
}

let paletteEditor = new cPaletteEditor();

function drawColorEditor() {
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
  drawColorEditor();
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
    drawColorEditor();
    viewFrac.setForceRedrawPalette();
    histor.store();
    }
}

function toggleColorEditor() {
  if (toggleDisplay('canvasColorDiv')) {
    drawColorEditor();
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

function initializePalette() {
  if (localStorage.lastpalette) {
    paletteKeys = JSON.parse(localStorage.lastpalette);
  }
  else {
    paletteKeys.push(new cPaletteKey(  0, 0xff, 0xff, 0xff));
    paletteKeys.push(new cPaletteKey(250, 0,    0,    0xff));
    paletteKeys.push(new cPaletteKey(500, 0xff, 0,    0   ));
    paletteKeys.push(new cPaletteKey(750, 0xff, 0xff, 0   ));
    paletteKeys.push(new cPaletteKey(999, 0xff, 0xff, 0xff));
  }
  fractalPalette = createPaletteFromKeys(paletteKeys);
  parameters.colorValue = paletteKeys[0];
}

function initializePaletteEditor() {
  paletteEditor.colorPicker = mainPane.addInput(parameters, 'colorValue', { picker: 'inline', expanded: true }).on('change', () => { 
    let p = paletteKeys[lastSelectedColor];
    p.r = parameters.colorValue.r;
    p.g = parameters.colorValue.g;
    p.b = parameters.colorValue.b;
    fractalPalette = createPaletteFromKeys(paletteKeys);
    drawColorEditor();
    viewFrac.setForceRedrawPalette();
    drag.state = 'colorpicker';
  });
  paletteEditor.buttonAddColor = mainPane.addButton({title: 'Add color [A]'}).on('click', addColor);
  paletteEditor.buttonRemoveColor = mainPane.addButton({title: 'Remove color [X]'}).on('click', removeColor);
  paletteEditor.colorPicker.hidden = true;
  paletteEditor.buttonAddColor.hidden = true;
  paletteEditor.buttonRemoveColor.hidden = true;
}