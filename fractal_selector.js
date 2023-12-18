// FractalSelector

import * as util from './util.js'
import glob from './global.js'
import FractalViewer from './fractal_viewer.js';
import Formula from './formula.js';

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
    this.viewPort.setPalette(glob.PaletteEditor.palette);
    this.viewPort.setFormulas(Formula.formulasFromString(this.value));
    this.viewPort.processInBackground();
  }

  updateSize(size) {
    this.canvas.width = size;
    this.canvas.height = size;
    this.viewPort.prepare()
    this.viewPort.processInBackground();
  }

  increaseDetail() {
    this.viewPort.processInBackground();
  }

  isFinished() {
    return this.viewPort.isFinished();
  }

}

export default class FractalSelector {

  constructor(div) {
    this.active = false;
    this.items = [];
    this.div = div;
    this.backgroundDiv = document.getElementById('mainDiv');
    this.tileSize = 100;
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
    this.backgroundDiv.style.display = 'none';
    this.div.style.display = '';
    this.update();
  }

  hide() {
    this.active = false;
    this.div.style.display = 'none';
    this.backgroundDiv.style.display = '';
  }

  toggle() {
    if (this.active)
      this.hide();
    else
      this.show();
  }

  processInBackground() {
    const startms = util.getMilliseconds();
    while (!this.updated && util.getMilliseconds() - startms < 40) {
      for (let item of this.items) {
        if (!item.canvas) {
          item.createCanvas(this.div, this.tileSize);
          return;
        }
        if (item.canvas.width != this.tileSize) {
          item.updateSize(this.tileSize);
          return;
        }
      }
      for (let item of this.items) {
        if (!item.isFinished()) {
          item.increaseDetail();
          return;
        }
      }
      this.updated = true;
    }
  }

}
