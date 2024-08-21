import { useEffect, useMemo, useRef } from "react";
import { TbTriangleMinus, TbTrianglePlus } from "react-icons/tb";
import Formula from "~/math/formula";
import { getBoundingBoxFrom2DArray, getEventOffsetXY, getEventPageXY, getMs } from "~/math/util";
import { findNearestPoint } from "~/math/nearest";
import { type vec2, vec2add, vec2sub, vec2angleDifference, vec2magnitudeRatio, vec2mul } from "~/math/vec2";
import Viewport from "~/math/viewport";
import { iconStyle, useResizeObserver } from "./browserUtils";

export default function FormulaEditor(props: { form: string, changeCallback: (form: string) => void, menu: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gui = useMemo(() => new FormulaEditorGUI(props.changeCallback), [props.changeCallback]);

  useEffect(() => gui.loadFormulas(props.form), [gui, props.form]);

  useResizeObserver(canvasRef, gui.setCtx);

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.key === "Insert") gui.addFormula();
      if (e.key === "Delete") gui.removeFormula(); 
    };
    document.addEventListener('keydown', keyDownHandler);
    return () => { document.removeEventListener('keydown', keyDownHandler); }
  }, [gui]);

  return (<>
    <div className="relative size-full">
      <div className="absolute top-0 left-0 right-0 flex flex-row justify-between pointer-events-none">
        <div className="flex flex-row pointer-events-auto">
          <TbTrianglePlus
            className={iconStyle}
            onClick={gui.addFormula}
            title="Add triangle [Insert]"
          />
          <TbTriangleMinus
            className={iconStyle}
            onClick={gui.removeFormula}
            title="Remove selected triangle [Delete]"
          />
        </div>
        <div className="pointer-events-auto">
          {props.menu}
        </div>
      </div>
      <canvas className="size-full" ref={canvasRef} />
    </div>
  </>);
}

class FormulaEditorGUI extends Viewport {
  formulas: Formula[] = [];
  selectedFormula = 0;
  selectedPoint: number | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  isDragging = false;
  dragStart: vec2 = [0, 0];
  draggedFormula: Formula | null = null;
  lastChangeCallbackTime = 0;
  
  constructor(public changeCallback: (form: string) => void) {
    super(.6);
    if (typeof window !== 'undefined') {
      window.addEventListener('pointermove', this.onWindowPointerMove);
      window.addEventListener('pointerup',   this.onWindowPointerUp);
    }
  }

  setCtx = (ctx: CanvasRenderingContext2D) => {
    this.ctx = ctx;
    ctx.canvas.addEventListener('wheel', this.onWheel, { passive: true });
    ctx.canvas.addEventListener('pointerdown', this.onPointerDown);
    ctx.canvas.addEventListener('pointermove', this.onPointerMove);
    this.setSize([ctx.canvas.width, ctx.canvas.height]);
    this.resizeFormulas();
  }

  onWheel = (e: WheelEvent) => {
    const scaleMultiplier = (e.deltaY < 0) ? 1.1 : 1 / 1.1;
    const screenMousePoint = getEventOffsetXY(e);
    const dataMousePoint = this.fromScreen(screenMousePoint);
    this.manualScale *= scaleMultiplier;
    this.updateTransform();
    const uncorrectedScreenMousePoint = this.toScreen(dataMousePoint);
    this.manualShift = vec2add(this.manualShift, vec2sub(screenMousePoint, uncorrectedScreenMousePoint));
    this.updateTransform();
    this.draw();
  }

  onPointerDown = (e: MouseEvent) => {
    if (e.button == 0) {
      const screenMousePoint = getEventOffsetXY(e);
      const dataMousePoint = this.fromScreen(screenMousePoint);
      this.selectNearestFormula(dataMousePoint);
      if (this.selectedPoint != null) {
        this.isDragging = true;
        this.dragStart = dataMousePoint;
        this.draggedFormula = this.formulas[this.selectedFormula]!.clone();
      }
      else {
        this.isDragging = true;
        this.dragStart = vec2sub(this.manualShift, screenMousePoint);
        this.draggedFormula = null;
      }
    }
    if (e.button == 1) {
      this.resetToAuto();
      this.resizeFormulas();
    }
  }

  onPointerMove = (e: MouseEvent) => {
    if (this.isDragging || e.buttons) return;
    const lastSelectedFormula = this.selectedFormula;
    const lastSelectedPoint = this.selectedPoint;
    const dataMousePoint = this.fromScreen(getEventOffsetXY(e));
    this.selectNearestFormula(dataMousePoint);
    if (lastSelectedFormula === this.selectedFormula && lastSelectedPoint === this.selectedPoint) return;
    this.draw();
  }

  onWindowPointerMove = (e: MouseEvent) => {
    if (!this.ctx) return;
    if (!this.isDragging) return;
    const rect = this.ctx.canvas.getBoundingClientRect();
    const screenMousePoint = vec2sub(getEventPageXY(e), [rect.left, rect.top]);
    if (this.draggedFormula != null) {
      this.doDragFormula(this.fromScreen(screenMousePoint), e);
      this.callChangeCallback();
      this.draw();
    }
    else {
      this.manualShift = vec2add(this.dragStart, screenMousePoint);
      this.resizeFormulas();
    }
  }

  onWindowPointerUp = () => {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.resizeFormulas();
  }

  doDragFormula(dataMousePoint: vec2, e: MouseEvent) {
    const tmpFormula = this.draggedFormula!.clone();
    const basePoint = tmpFormula.iterate([0, 0]);
    const deltaStartMouse = vec2sub(dataMousePoint, this.dragStart);
    const deltaBaseMouse = vec2sub(basePoint, dataMousePoint);
    const deltaBaseStart = vec2sub(basePoint, this.dragStart);
    const angle = vec2angleDifference(deltaBaseStart, deltaBaseMouse);
    const scale = vec2magnitudeRatio(deltaBaseStart, deltaBaseMouse);
    if (this.selectedPoint == 0) {
      tmpFormula.shift(vec2mul(deltaStartMouse, [e.ctrlKey?0:1, e.shiftKey?0:1]));
      }
    if (this.selectedPoint == 3) {
      if (!e.shiftKey) tmpFormula.rotate([angle, angle]);
      if (!e.ctrlKey) tmpFormula.rescale([scale, scale]);
    }
    if (this.selectedPoint == 1) {
      if (!e.shiftKey) tmpFormula.rotate([0, angle]);
      if (!e.ctrlKey) tmpFormula.rescale([1, scale]);
    }
    if (this.selectedPoint == 2) {
      if (!e.shiftKey) tmpFormula.rotate([angle, 0]);
      if (!e.ctrlKey) tmpFormula.rescale([scale, 1]);
    }
    this.formulas[this.selectedFormula] = tmpFormula;
  }

  callChangeCallback() {
    const form = Formula.toString(this.formulas);
    this.lastChangeCallbackTime = getMs();
    this.changeCallback(form);
  }

  loadFormulas(formulaString: string) {
    if (this.isDragging || getMs() - this.lastChangeCallbackTime < 100) return;
    this.formulas = Formula.fromString(formulaString);
    this.selectedFormula = this.formulas.length - 1;
    this.selectedPoint = null;
    this.resetToAuto();
    this.resizeFormulas();
  }

  selectNearestFormula(point: vec2) {
    const fractalPoints = this.getFractalPoints();
    const nearestIndex = findNearestPoint(fractalPoints as vec2[], point, 20 / this.scale);
    if (nearestIndex != null) {
      this.selectedFormula = fractalPoints[nearestIndex]![2]!;
      this.selectedPoint   = fractalPoints[nearestIndex]![3]!;
    }
    else {
      this.selectedPoint = null;
    }
  }

  getFormulaPoints(formula: Formula) {
    const points: vec2[] = [
      [ 0, 0],
      [ 0, 1],
      [ 1, 0],
      [-1, 0]
    ];
    return points.map(point => formula.iterate(point))
  }
  
  getFractalPoints() {
    return this.formulas.map((formula, formulaIndex) => 
      this.getFormulaPoints(formula).map((point, pointIndex) => 
        point.concat([formulaIndex, pointIndex])
      )
    )
    .flat();
  }

  getFormulaSegments(formula: Formula) {
    const pts = this.getFormulaPoints(formula);
    return [
      [pts[0]!, pts[1]!],
      [pts[1]!, pts[2]!],
      [pts[2]!, pts[3]!],
      [pts[3]!, pts[0]!]
    ];
  }
  
  getFractalSegments() {
    return this.formulas
    .map(formula => this.getFormulaSegments(formula))
    .flat();
  }

  resizeFormulas() {
    if (this.manualScale == 1 && this.manualShift[0] == 0 && this.manualShift[1] == 0) {
      const points = this.getFractalPoints().concat([[-1, -1], [1, 1]]);
      const [min, max] = getBoundingBoxFrom2DArray(points);
      this.setBoundingBox(min, max);
    }
    else {
      this.updateTransform();
    }
    this.draw();
  }
  
  draw() {
    if (!this.ctx) return;
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.lineWidth = 1;
    this.drawBaseFormula();
    for (let i = 0; i < this.formulas.length; i++) {
      if (i != this.selectedFormula)
      this.drawFormula(i, false, null);
    }
    this.drawFormula(this.selectedFormula, true, this.selectedPoint);
  }

  drawFormula(formulaIndex: number, isSelected: boolean, selectedPoint: number | null) {
    if (!this.ctx) return;
    function drawEndPoint(th: FormulaEditorGUI, pointIndex: number) {
      const point = screenPoints[pointIndex];
      ctx.strokeStyle = (pointIndex == selectedPoint) ? 'red' : 'orange';
      ctx.lineWidth = 3;
      th.drawCircle(point!, 1);
    }
    const dataPoints = this.getFormulaPoints(this.formulas[formulaIndex]!);
    const screenPoints: vec2[] = [];
    for (const dataPoint of dataPoints) {
      screenPoints.push(this.toScreen(dataPoint));
    }
    const ctx = this.ctx;
    ctx.strokeStyle = isSelected ? 'orange' : 'black';
    this.drawTriangle(screenPoints);
    if (isSelected) {
      drawEndPoint(this, 0);
      drawEndPoint(this, 1);
      drawEndPoint(this, 2);
      drawEndPoint(this, 3);
    }
  }
  
  drawBaseFormula() {
    this.ctx!.strokeStyle = 'lightgrey';
    this.drawTriangle([
      this.toScreen([ 0, 0]),
      this.toScreen([ 0, 1]),
      this.toScreen([ 1, 0]),
      this.toScreen([-1, 0])
    ]);
  }

  drawTriangle(points: vec2[], hovered = false) {
    this.ctx!.lineWidth = hovered ? 2 : 1;
    this.ctx!.beginPath();
    this.ctx!.setLineDash([1,3]);
    this.moveTo(points[0]!);
    this.lineTo(points[3]!);
    this.lineTo(points[1]!);
    this.lineTo(points[2]!);
    this.ctx!.stroke();
    this.ctx!.beginPath();
    this.ctx!.setLineDash([]);
    this.moveTo(points[2]!);
    this.lineTo(points[0]!);
    this.lineTo(points[1]!);
    this.ctx!.stroke();
  }

  moveTo(point: vec2) {
    this.ctx!.moveTo(point[0], point[1]);
  }
  
  lineTo(point: vec2) {
    this.ctx!.lineTo(point[0], point[1]);
  }

  drawCircle(point: vec2, radius: number) {
    this.ctx!.beginPath();
    this.ctx!.arc(point[0], point[1], radius, 0, 2 * Math.PI);
    this.ctx!.stroke();
  }

  addFormula = () => {
    this.formulas.push(new Formula());
    this.selectedFormula = this.formulas.length - 1;
    this.selectedPoint = null;
    this.resizeFormulas();
    this.callChangeCallback();
  }
  
  removeFormula = () => {
    if (this.formulas.length < 3) return;
    this.formulas.splice(this.selectedFormula, 1);
    this.selectedFormula = this.formulas.length - 1;
    this.selectedPoint = null;
    this.resizeFormulas();
    this.callChangeCallback();
  }

}
