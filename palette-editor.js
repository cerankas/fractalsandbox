// PaletteEditor

class PaletteEditor {

  constructor(ctx, palette) {
    this.ctx = ctx;
    this.maxx = 0;
    this.colorValue = {r: 0, g:0 , b: 0};
    this.colorPosition = 3;
    this.paletteKeys = [];
    this.palette = [];
    this.selectedColor = null;
    this.lastSelectedColor = 0;
    this.dragIndex = 0;
    this.loadPalette(palette);
    ctx.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
    ctx.canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
  }
  
  setMaxX(maxx) {
    this.maxx = maxx;
  }
  
  getX(i) {
    return  (this.maxx + 1) * i / PaletteKey.PALETTE_LENGTH;
  }
  
  getIndex(x) {
    if (x < 0) x = 0;
    if (x >= this.maxx) x = this.maxx;
    return (x * PaletteKey.PALETTE_LENGTH / (this.maxx + 1)) | 0;
  }

  onPointerDown(e) {
    if (e.button == 0) {
      this.selectNearestColor(getEventOffsetXY(e));
      if (this.selectedColor != null) {
        globalDrag.startDrag(this);
        this.dragIndex = this.selectedColor;
      }
    }
  }

  onPointerMove(e) {
    if (!globalDrag.isDragging()) {
      this.selectNearestColor(getEventOffsetXY(e));
      this.draw();
    }
  }

  onDrag(mousePoint) {
    const p = this.paletteKeys[this.dragIndex];
    let newIndex = this.getIndex(mousePoint[0]);
    if (this.dragIndex > 0 && newIndex <= this.paletteKeys[this.dragIndex - 1].index) {
      newIndex = this.paletteKeys[this.dragIndex - 1].index + 1;
    }
    if (this.dragIndex < this.paletteKeys.length - 1 && newIndex >= this.paletteKeys[this.dragIndex + 1].index) {
      newIndex = this.paletteKeys[this.dragIndex + 1].index - 1;
    }
    p.index = newIndex;
    this.palette = createPaletteFromKeys(this.paletteKeys);
  }

  onDragEnd() {
    
  }

  draw() {
    const ctx = this.ctx;
    const c  = ctx.canvas;
    c.width = c.parentElement.clientWidth;
    c.height = c.parentElement.clientHeight;
    const d = 5;
    const h = c.height;
    this.setMaxX(c.width);
    ctx.fillStyle = 'black';
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
    for (let x = 0; x < c.width; x++) {
      const i = this.getIndex(x);
      const rgb = this.palette[i];
      const hex = rgbToHex(rgb & 0xff, (rgb >> 8) & 0xff, (rgb >> 16) & 0xff);
      ctx.fillStyle = hex;
      ctx.fillRect(x, 0, x, c.height);
    }
    for (let i = 0; i < this.paletteKeys.length; i++) {
      if (i == this.selectedColor) {
        ctx.lineWidth = 4;
      }
      else {
        ctx.lineWidth = 1;
      }
      const key = this.paletteKeys[i];
      const x = this.getX(key.index);
      const rgb = key.r + key.g + key.b;
      ctx.beginPath();
      ctx.strokeStyle = rgb > 1.5 * 0xff ? 'black' : 'white';
      ctx.moveTo(x - d, 0);
      ctx.lineTo(x, d);
      ctx.lineTo(x + d, 0);
      ctx.stroke();
    }
  }

  setSelectedColor(color) {
    const rgb = hexToRGB(color);
    let p = this.paletteKeys[this.lastSelectedColor];
    p.r = rgb[0];
    p.g = rgb[1];
    p.b = rgb[2];
    this.palette = createPaletteFromKeys(this.paletteKeys);
  }
  
  initializePane(pane) {
    this.colorPicker = pane.addInput(this, 'colorValue', { picker: 'inline', expanded: true }).on('change', () => {
      let p = this.paletteKeys[this.lastSelectedColor];
      p.r = this.colorValue.r;
      p.g = this.colorValue.g;
      p.b = this.colorValue.b;
      this.palette = createPaletteFromKeys(this.paletteKeys);
    });
    this.buttonAddColor = pane.addButton({title: 'Add color [A]'}).on('click', this.addColor.bind(this));
    this.buttonRemoveColor = pane.addButton({title: 'Remove color [X]'}).on('click', this.removeColor.bind(this));
    this.colorPicker.hidden = true;
    this.buttonAddColor.hidden = true;
    this.buttonRemoveColor.hidden = true;
  }

  loadPalette(palette) {
    if (palette) {
      this.paletteKeys = paletteKeysFromString(palette);
    }
    else {
      this.paletteKeys.push(new PaletteKey(  0, 0xff, 0xff, 0xff));
      this.paletteKeys.push(new PaletteKey(250, 0,    0,    0xff));
      this.paletteKeys.push(new PaletteKey(500, 0xff, 0,    0   ));
      this.paletteKeys.push(new PaletteKey(750, 0xff, 0xff, 0   ));
      this.paletteKeys.push(new PaletteKey(999, 0xff, 0xff, 0xff));
    }
    this.palette = createPaletteFromKeys(this.paletteKeys);
    this.colorValue = this.paletteKeys[0];
  }
  
  addColorAt(index) {
    let i = 0;
    while (i < this.paletteKeys.length - 1 && this.paletteKeys[i].index < index) i++;
    const rgb = this.palette[index];
    this.paletteKeys.splice(i, 0, new PaletteKey(index, rgb & 0xff, (rgb >> 8) & 0xff, (rgb >> 16) & 0xff));
    this.palette = createPaletteFromKeys(this.paletteKeys);
  }
  
  addColor() {
    if (this.colorPicker.hidden) return;
    let i = this.lastSelectedColor;
    if (i == this.paletteKeys.length - 1) i--;
    this.addColorAt(((this.paletteKeys[i].index + this.paletteKeys[i + 1].index) / 2) | 0);
  }
  
  removeColor() {
    if (this.colorPicker.hidden) return;
    if (this.paletteKeys.length > 2) {
      this.paletteKeys.splice(this.lastSelectedColor, 1);
      if (this.lastSelectedColor > 0) {
        this.lastSelectedColor--;
      }
      this.palette = createPaletteFromKeys(this.paletteKeys);
    }
  }
  
  toggle() {
    if (toggleDisplay('canvasColorDiv')) {
      this.draw();
      //this.colorPicker.hidden = false;
    } 
    else {
      //this.colorPicker.hidden = true;
    }
  }
  
  selectNearestColor(p) {
    const points = [];
    for (let key of this.paletteKeys) {
      points.push([this.getX(key.index), 10]);
    }
    this.selectedColor = findNearestPoint(points, p, 100);
    if (this.selectedColor != null) {
      this.lastSelectedColor = this.selectedColor;
      this.colorValue = this.paletteKeys[this.selectedColor];
      this.colorPicker.refresh();
    }
  }
  
}
