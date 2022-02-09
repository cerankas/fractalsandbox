// FractalEditor

class FractalEditor extends Viewport {
  
  constructor(ctx) {
    super(ctx, .6);
    this.formulas = [];
    this.selectedFormula = 0;
    this.selectedPoint = null;
    this.balanceFactor = 1;
    this.dragFormula = null;
    this.dragStart = [0, 0];
    this.dragLock = null;
    ctx.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
    ctx.canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
  }

  hasSelectedPoint() {
    return this.selectedPoint != null;
  }

  onPointerDown(e) {
    if (e.button == 0) {
      const screenMousePoint = getEventClientXY(e);
      const dataMousePoint = this.fromScreen(screenMousePoint);
      this.selectNearestFormula(dataMousePoint);
      if (this.hasSelectedPoint()) {
        this.dragFormula = this.formulas[this.selectedFormula].clone();
        this.dragStart = dataMousePoint;
        this.dragLock = null;
        GlobalDrag.startDrag(this);
      }
      else {
        this.dragFormula = null;
        this.dragStart = this.manualShift.sub(screenMousePoint);
        GlobalDrag.startDrag(this);
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

  onDrag(screenMousePoint) {
    if (this.dragFormula != null) {
      this.doDragFormula(this.fromScreen(screenMousePoint));
      this.drawFormulas();
    }
    else {
      this.manualShift = this.dragStart.add(screenMousePoint);
      this.resizeFormulas();
    }
  }

  doDragFormula(dataMousePoint) {
    const tmpFormula = this.dragFormula.clone();
    const delta = dataMousePoint.sub(this.dragStart);
    if (this.selectedPoint == 0) {
      tmpFormula.shift(delta[0], delta[1]);
      }
    if (this.selectedPoint == 2) {
      this.dragMove(tmpFormula, dataMousePoint);
    }
    this.formulas[this.selectedFormula] = tmpFormula;
  }

  onDragEnd() {
    this.resizeFormulas();
  }

  selectNearestFormula(point) {
    const fractalPoints = this.getFractalPoints();
    const nearestIndex = findNearestPoint(fractalPoints, point, 20 / this.scale);
    if (nearestIndex != null) {
      this.selectedFormula = fractalPoints[nearestIndex][2];
      this.selectedPoint   = fractalPoints[nearestIndex][3];
    }
    else {
      this.selectedPoint = null;
    }
  }

  getFormulaPoints(formulaIndex) {
    const formula = this.formulas[formulaIndex];
    const formulaPoints = [];
    const formulaVectors = [
      [ 0, 0],
      [ 0, 1],
      [ 1, 0],
      [-1, 0],
    ];
    for (let vector of formulaVectors) {
      formulaPoints.push(formula.iterate(vector));
    }
    return formulaPoints;
  }
  
  getFractalPoints() {
    const fractalPoints = [];
    for (let formulaIndex = 0; formulaIndex < this.formulas.length; formulaIndex++) {
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
    for (let i = 0; i < this.formulas.length; i++) {
      if (i != this.selectedFormula)
      this.drawFormula(i);
    }
    this.drawFormula(this.selectedFormula, true, this.selectedPoint);
  }

  drawFormula(formulaIndex, isSelected, selectedPoint) {
    function drawEndPoint(th, pointIndex, size) {
      const point = screenPoints[pointIndex];
      ctx.strokeStyle = (pointIndex == selectedPoint) ? 'red' : 'orange';
      ctx.lineWidth = 2;
      th.drawCircle(point, 1 + size);
    }
    const dataPoints = this.getFormulaPoints(formulaIndex);
    const screenPoints = [];
    for (let dataPoint of dataPoints) {
      screenPoints.push(this.toScreen(dataPoint));
    }
    const ctx = this.ctx;
    ctx.strokeStyle = isSelected ? 'orange' : 'black';
    this.drawTriangle(screenPoints);
    if (isSelected) {
      drawEndPoint(this, 0, 1);
      drawEndPoint(this, 1, 0);
      drawEndPoint(this, 2, 1);
      drawEndPoint(this, 3, 0);
    }
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

  drawTriangle(points) {
    this.ctx.beginPath();
    this.moveTo(points[0]);
    this.lineTo(points[1]);
    this.lineTo(points[2]);
    this.lineTo(points[3]);
    this.lineTo(points[1]);
    this.ctx.stroke();
  }

  moveTo(point) {
    this.ctx.moveTo(point[0], point[1]);
  }
  
  lineTo(point) {
    this.ctx.lineTo(point[0], point[1]);
  }

  drawCircle(point, radius) {
    this.ctx.beginPath();
    this.ctx.arc(point[0], point[1], radius, 0, 2 * Math.PI);
    this.ctx.stroke();
  }

  addFormula() {
    this.formulas.push(new Formula());
    this.selectedFormula = this.formulas.length - 1;
    this.selectedPoint = null;
    windowResize();
    GlobalHistory.store();
  }
  
  removeFormula(formulaIndex) {
    if (formulaIndex == null) {
      formulaIndex = this.selectedFormula;
    }
    if (formulaIndex != null && this.formulas.length > 2) {
      this.formulas.splice(formulaIndex, 1);
      windowResize();
      GlobalHistory.store();
    }
    this.selectedFormula = 0;
    this.selectedPoint = null;
  }

}
