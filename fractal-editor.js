// FractalEditor

class FractalEditor {
  constructor(view) {
    this.view = view;
    this.state = null;
    this.formulas = [];
    this.referenceFormulas = [];
    window.addEventListener('pointermove', this.onPointerMove.bind(this));
    window.addEventListener('pointerup', this.onPointerUp.bind(this));
  }

  onPointerDown(e) {
    if (e.button == 0) {
      let mousePoint = view.fromScreen([e.offsetX, e.offsetY]);
      selectNearestFormula(mousePoint);
      if (selectedFormula) {
        drag.state = 'formula';
        drag.startPoint = mousePoint;
        dragFormula = fractal.formulas[selectedFormula.formula].clone();
      }
      if (!selectedFormula) {
        drag.state = 'viewform';
        drag.startPoint[0] = viewForm.manualShiftx - e.offsetX;
        drag.startPoint[1] = viewForm.manualShifty - e.offsetY;
      }
    }
    if (e.button == 2) {
      viewForm.resetManual();
      resizeFormulas();
    }
  }

  onPointerMove(e) {

  }

  onPointerUp(e) {

  }
}



function drawCage(view) {
  let p1 = view.toScreen([-1,-1]);
  let p2 = view.toScreen([0,0]);
  let p3 = view.toScreen([1,1]);
  let ctx = view.ctx;
  ctx.strokeStyle = 'lightgrey';
  ctx.beginPath();    
  ctx.moveTo(p1[0],p1[1]);
  ctx.lineTo(p1[0],p3[1]);
  ctx.lineTo(p3[0],p3[1]);
  ctx.lineTo(p3[0],p1[1]);
  ctx.lineTo(p1[0],p1[1]);
  ctx.moveTo(p2[0],p1[1]);
  ctx.lineTo(p2[0],p3[1]);
  ctx.moveTo(p1[0],p2[1]);
  ctx.lineTo(p3[0],p2[1]);
  ctx.stroke();
}

function drawFormula(view, p) {
  let p0 = view.toScreen(p[0]);
  let p1 = view.toScreen(p[1]);
  let p2 = view.toScreen(p[2]);
  let p3 = view.toScreen(p[3]);
  let ctx = view.ctx;
  ctx.beginPath();    
  ctx.moveTo(p0[0],p0[1]);
  ctx.lineTo(p1[0],p1[1]);
  ctx.lineTo(p2[0],p2[1]);
  ctx.lineTo(p3[0],p3[1]);
  ctx.lineTo(p1[0],p1[1]);
  ctx.stroke();
}

function drawFormulas(view = viewForm) {
  let ctx = view.ctx;
  ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
  ctx.lineWidth = 1;
  drawCage(view);
  for (let i in fractal.formulas) {
    let points = fractal.formulas[i].getPoints();
    ctx.strokeStyle = (selectedFormula && i == selectedFormula.formula) ? 'orange' : 'black';
    drawFormula(view,points);    
  }
  if (selectedFormula) {
    ctx.strokeStyle = 'red';
    let p = view.toScreen(fractal.formulas[selectedFormula.formula].getPoints()[selectedFormula.point]);
    ctx.beginPath();
    ctx.arc(p[0], p[1], 2, 0, 2 * Math.PI);
    ctx.stroke();
  }
}