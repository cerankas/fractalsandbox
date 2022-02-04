// History

class cHistory {

  constructor() {
    this.stack = [];
    this.pointer = 0;
  }

  store() {
    if (this.pointer < this.stack.length - 1)
      this.stack.splice(this.pointer + 1);
    let item = {
      palette: JSON.stringify(paletteKeys),
      fractal: viewFrac.fractalString,
    };
    this.stack.push(item);
    this.pointer = this.stack.length - 1;
  }

  restore(item) {
    paletteKeys = JSON.parse(item.palette);
    fractal = new Fractal(item.fractal);
    fractalPalette = createPaletteFromKeys(paletteKeys);
    windowResize();
  }
  
  back() {
    if (this.pointer > 0) {
      this.pointer--;
      this.restore(this.stack[this.pointer]);
    }
  }
  
  forward() {
    if (this.pointer < this.stack.length - 1) {
      this.pointer++;
      this.restore(this.stack[this.pointer]);
    }
  }

}
