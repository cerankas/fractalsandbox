// Fractal Sandbox by Szymon Ceranka

'use strict';

let fractal;
let fractalPalette = [];
let paletteKeys = [];

let selectedFormula = null;
let lastSelectedFormula = null;

let selectedColor = null;
let lastSelectedColor = 0;

let drag = {
  state: false, // false, formula, viewform, viewfrac, color, colorpicker
  startPoint: [0, 0]
};

let viewFrac, viewForm;
