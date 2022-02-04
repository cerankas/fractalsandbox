// FractalSelector

class FractalSelectorItem {

  constructor(key, value) {
    this.key = key;
    this.value = value;
  }
  createCanvas(div, size) {
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('id', this.key);
    this.canvas.setAttribute('name', 'selectFractal');
    this.canvas.setAttribute('style', 'border: 1px dotted Grey; display: inline');
    this.canvas.width = size;
    this.canvas.height = size;
    this.canvas.setAttribute('onClick', 'loadFractal(\'' + this.value + '\');');
    div.appendChild(this.canvas);
    this.canvas = document.getElementById(this.key);
    this.viewPort = new FractalViewer(this.canvas.getContext('2d'));
    this.viewPort.prepare(new Fractal(this.value));
    this.viewPort.draw();
    this.detail = 1;
  }
  updateSize(size) {
    this.canvas.width = size;
    this.canvas.height = size;
    this.viewPort.prepare();
    this.viewPort.draw();
    this.detail = 1;
  }
  increaseDetail() {
    this.viewPort.draw();
    this.detail++;
  }
}

class FractalSelector {
  constructor() {
    this.active = false;
    this.items = [];
  }
  update() {
    function isFractalKey(key) { 
      return key.substr(0,8) == 'fractal#';
    }
    function updateItem(table, key, value) {
      for (let item of previousItems)
        if (item.key == key && item.value == value) {
          table.push(item);
          return;
        }
      table.push(new FractalSelectorItem(key, value));
    }
    const previousItems = this.items;
    this.items = [];
    for (let i = 0; i<localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!isFractalKey(key)) continue;
      const value = localStorage[key];
      updateItem(this.items, key, value);
    }
    this.items.sort((a, b) => { if (a.key < b.key) return -1; return a.key > b.key; });
    this.updated = false;
    // update items in fractalSelectorDiv
  }
  show() {
    this.active = true;
    document.getElementById('mainDiv').style.display = 'none';
    document.getElementById('fractalSelectorDiv').style.display = '';
    this.update();
  }
  hide() {
    this.active = false;
    document.getElementById('fractalSelectorDiv').style.display = 'none';
    document.getElementById('mainDiv').style.display = '';
  }
  toggle() {
    if (this.active)
      this.hide();
    else
      this.show();
  }
  computeInBackground() {
    const startms = getMilliseconds();
    while (!this.updated && getMilliseconds() - startms < 200) {
      const div = document.getElementById('fractalSelectorDiv');
      for (let item of this.items) {
        if (!item.canvas) {
          item.createCanvas(div, parameters.tileSize);
          return;
        }
        if (item.canvas.width != parameters.tileSize) {
          item.updateSize(parameters.tileSize);
          return;
        }
      }
      for (let item of this.items) {
        if (item.detail < parameters.tileDetail) {
          item.increaseDetail();
          return;
        }
      }
      this.updated = true;
    }
  }
}
