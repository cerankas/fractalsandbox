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

let dragFormula;

let doZoomForm = false;
let doZoomFrac = false;

let mainPane, loadPane;
//let userPane, userButton, sessionId;

const parameters = {
  balanceFactor: 1,

  //email: '',
  //password: '',
  //nickname: '',

  tileSize: 200,
  tileDetail: 10,

  formulaIndex: 1,

  colorIndex: 1,
  colorValue: {r: 0, g:0 , b: 0},
  colorPosition: 3,
};

let globalHistory;

let globalPaletteEditor;

let globalFractalSelector;
