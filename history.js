// History

class GlobalHistory {

  static stack = [];
  static pointer = 0;

  static store() {
    if (this.pointer < this.stack.length - 1)
      this.stack.splice(this.pointer + 1);
    let item = {
      palette: JSON.stringify(paletteKeys),
      fractal: globalFractalViewer.fractalString,
    };
    this.stack.push(item);
    this.pointer = this.stack.length - 1;
  }

  static restore(item) {
    paletteKeys = JSON.parse(item.palette);
    globalFractalEditor.formulas = new Fractal(item.fractal).formulas;
    fractalPalette = createPaletteFromKeys(paletteKeys);
    windowResize();
  }
  
  static back() {
    if (this.pointer > 0) {
      this.pointer--;
      this.restore(this.stack[this.pointer]);
    }
  }
  
  static forward() {
    if (this.pointer < this.stack.length - 1) {
      this.pointer++;
      this.restore(this.stack[this.pointer]);
    }
  }

}
