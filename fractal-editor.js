// FractalEditor

class FractalEditor extends Viewport {
  
  constructor(ctx) {
    super(ctx, .6);
    this.formulas = [];
    this.selectedFormula = null;
    this.balanceFactor = 1;
    this.formulaVectors = [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1]
    ];
    ctx.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
    ctx.canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
  }

  onPointerDown(e) {
    if (e.button == 0) {
      const screenMousePoint = getEventClientXY(e);
      const dataMousePoint = this.fromScreen(screenMousePoint);
      this.selectNearestFormula(dataMousePoint);
      if (this.selectedFormula) {
        GlobalDrag.startDrag(this, this.formulas[this.selectedFormula.formula].clone(), screenMousePoint);
      }
      if (!this.selectedFormula) {
        const point = subtractVectors(this.manualShift, screenMousePoint);
        GlobalDrag.startDrag(this, null, point);
      }
    }
    if (e.button == 2) {
      this.resetManual();
      this.resizeFormulas();
    }
  }

  onPointerMove(e) {
    if (GlobalDrag.dragOwner != null) return;
    const dataMousePoint = this.fromScreen(getEventClientXY(e));
    this.selectNearestFormula(dataMousePoint);
    this.drawFormulas();
  }

  onDrag(screenMousePoint, e) {
    if (GlobalDrag.dragData != null) {
      this.formulas[this.selectedFormula.formula] = GlobalDrag.dragData.clone();
      const delta = subtractVectors(screenMousePoint, GlobalDrag.startPoint);
      this.formulas[this.selectedFormula.formula].setPoint(delta[0], delta[1], this.selectedFormula.point);
    }
    if (GlobalDrag.dragData == null) {
      this.manualShift = addVectors(GlobalDrag.startPoint, screenMousePoint);
      this.resizeFormulas();
      return;
    }
    this.drawFormulas();
  }

  onDragEnd() {
  }

  selectNearestFormula(point) {
    const fractalPoints = this.getFractalPoints();
    const nearestIndex = findNearestPoint(fractalPoints, point, 30 / this.scale);
    this.selectedFormula = null;
    if (nearestIndex != null) {
      this.selectedFormula = {
        formula: fractalPoints[nearestIndex][2],
        point: fractalPoints[nearestIndex][3]
      };
    }
    if (this.selectedFormula) {
      this.lastSelectedFormula = this.selectedFormula;
    }
  }

  getFormulaPoints(formulaIndex) {
    const formula = this.formulas[formulaIndex];
    const formulaPoints = [];
    for (let vector of this.formulaVectors) {
      formulaPoints.push(formula.iterate(vector));
    }
    return formulaPoints;
  }
  
  getFractalPoints() {
    const fractalPoints = [];
    for (let formulaIndex in this.formulas) {
      const formulaPoints = this.getFormulaPoints(formulaIndex);
      for (let pointIndex = 0; pointIndex < formulaPoints.length; pointIndex++) {
        fractalPoints.push(formulaPoints[pointIndex].concat([formulaIndex, pointIndex]));
      }
    }
    return fractalPoints;
  }

  resizeFormulas() {
    if (this.manualScale == 1 && this.manualShift[0] == 0 && this.manualShift[1] == 0) {
      const points = this.getFractalPoints().concat([[-1, -1], [1, 1]]);
      const minMax = getBoundingBoxFrom2DArray(points);
      this.setMinMax(minMax);
    }
    else {
      this.updateTransform();
    }
    this.drawFormulas();
  }
  
  drawFormulas() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.lineWidth = 1;
    this.drawCage();
    for (let i in this.formulas) {
      ctx.strokeStyle = (this.selectedFormula && i == this.selectedFormula.formula) ? 'orange' : 'black';
      const points = this.getFormulaPoints(i);
      this.drawFormula(points);    
    }
    if (this.selectedFormula) {
      ctx.strokeStyle = 'red';
      const points = this.getFormulaPoints(this.selectedFormula.formula);
      const p = this.toScreen(points[this.selectedFormula.point]);
      ctx.beginPath();
      ctx.arc(p[0], p[1], 2, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }

  drawFormula(p) {
    const p0 = this.toScreen(p[0]);
    const p1 = this.toScreen(p[1]);
    const p2 = this.toScreen(p[2]);
    const p3 = this.toScreen(p[3]);
    const ctx = this.ctx;
    ctx.beginPath();    
    ctx.moveTo(p0[0],p0[1]);
    ctx.lineTo(p1[0],p1[1]);
    ctx.lineTo(p2[0],p2[1]);
    ctx.lineTo(p3[0],p3[1]);
    ctx.lineTo(p1[0],p1[1]);
    ctx.stroke();
  }

  drawCage() {
    const p1 = this.toScreen([-1,-1]);
    const p2 = this.toScreen([0,0]);
    const p3 = this.toScreen([1,1]);
    const ctx = this.ctx;
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

}

function addFormula() {
  globalFractalEditor.formulas.push(new Formula());
  windowResize();
  GlobalHistory.store();
}

function removeFormula(sel) {
  if (sel != null && globalFractalEditor.formulas.length > 2) {
    globalFractalEditor.formulas.splice(sel.formula,1);
    windowResize();
    GlobalHistory.store();
  }
  globalFractalEditor.selectedFormula = null;
  globalFractalEditor.lastSelectedFormula = null;
}
