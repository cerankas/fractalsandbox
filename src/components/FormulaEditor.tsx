import { useEffect, useMemo, useRef } from "react";
import { TbTriangleMinus, TbTrianglePlus } from "react-icons/tb";
import Formula from "~/math/formula";
import { getBoundingBoxFrom2DArray, getEventOffsetXY, getEventPageXY, getMs } from "~/math/util";
import { findNearestPoint, findNearestSegment } from "~/math/nearest";
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
  activeFormula: number | null = null;
  activePoint: number | null = null;
  selectedFormulas: number[] = [];
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
      this.selectActiveFormula(dataMousePoint);
      if (this.activeFormula != null) {
        if (e.ctrlKey) {
          if (!this.selectedFormulas.includes(this.activeFormula))
            this.selectedFormulas.push(this.activeFormula);
          else
            this.selectedFormulas.splice(this.selectedFormulas.indexOf(this.activeFormula), 1);
          this.draw();
        }
        else {
          if (!this.selectedFormulas.includes(this.activeFormula)) {
            this.selectedFormulas = [this.activeFormula];
            this.draw();
          }
          if (this.activeFormula != null && this.activePoint != null) {
            this.isDragging = true;
            this.dragStart = dataMousePoint;
            this.draggedFormula = this.formulas[this.activeFormula]!.clone();
          }
        }
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
    const lastActiveFormula = this.activeFormula;
    const lastActivePoint = this.activePoint;
    const dataMousePoint = this.fromScreen(getEventOffsetXY(e));
    this.selectActiveFormula(dataMousePoint);
    if (lastActiveFormula === this.activeFormula && lastActivePoint === this.activePoint) return;
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
    if (this.activeFormula == null) return;
    const tmpFormula = this.draggedFormula!.clone();
    const basePoint = tmpFormula.iterate([0, 0]);
    const deltaStartMouse = vec2sub(dataMousePoint, this.dragStart);
    const deltaBaseMouse = vec2sub(basePoint, dataMousePoint);
    const deltaBaseStart = vec2sub(basePoint, this.dragStart);
    const angle = vec2angleDifference(deltaBaseStart, deltaBaseMouse);
    const scale = vec2magnitudeRatio(deltaBaseStart, deltaBaseMouse);
    if (this.activePoint == 0) {
      tmpFormula.shift(vec2mul(deltaStartMouse, [e.ctrlKey?0:1, e.shiftKey?0:1]));
      }
    if (this.activePoint == 3) {
      if (!e.shiftKey) tmpFormula.rotate([angle, angle]);
      if (!e.ctrlKey) tmpFormula.rescale([scale, scale]);
    }
    if (this.activePoint == 1) {
      if (!e.shiftKey) tmpFormula.rotate([0, angle]);
      if (!e.ctrlKey) tmpFormula.rescale([1, scale]);
    }
    if (this.activePoint == 2) {
      if (!e.shiftKey) tmpFormula.rotate([angle, 0]);
      if (!e.ctrlKey) tmpFormula.rescale([scale, 1]);
    }
    this.formulas[this.activeFormula] = tmpFormula;
  }

  callChangeCallback() {
    const form = Formula.toString(this.formulas);
    this.lastChangeCallbackTime = getMs();
    this.changeCallback(form);
  }

  loadFormulas(formulaString: string) {
    if (this.isDragging || getMs() - this.lastChangeCallbackTime < 100) return;
    this.formulas = Formula.fromString(formulaString);
    this.activeFormula = null;
    this.activePoint = null;
    this.selectedFormulas = [];
    this.resetToAuto();
    this.resizeFormulas();
  }

  selectActiveFormula(point: vec2) {
    if (this.isDragging) return;
    
    if (this.selectedFormulas.length != 0) {
      const points = this.selectedFormulas.map(formula => this.getFormulaPoints(this.formulas[formula]!)).flat();
      const hoveredPoint = findNearestPoint(points, point, 20 / this.scale); 
      if (hoveredPoint != null) {
        this.activeFormula = this.selectedFormulas[hoveredPoint / 4 | 0]!;
        this.activePoint = hoveredPoint % 4;
        return;
      }
    }

    const segments = this.getFractalSegments();
    const hoveredSegment = findNearestSegment(segments as [vec2, vec2][], point, 20 / this.scale);
    if (hoveredSegment == null) {
      this.activeFormula = null;
      this.activePoint = null;
      return;
    }
    this.activeFormula = hoveredSegment / 4 | 0;

    const points = this.getFormulaPoints(this.formulas[this.activeFormula]!);
    this.activePoint = findNearestPoint(points, point, 20 / this.scale);
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
  
  getFormulaSegments(formula: Formula) {
    const pts = this.getFormulaPoints(formula);
    return [
      [pts[0]!, pts[1]!],
      [pts[1]!, pts[2]!],
      [pts[2]!, pts[3]!],
      [pts[3]!, pts[1]!]
    ];
  }
  
  getFractalPoints() {
    return this.formulas.map(formula => this.getFormulaPoints(formula)).flat();
  }

  getFractalSegments() {
    return this.formulas.map(formula => this.getFormulaSegments(formula)).flat();
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
      this.drawFormula(i, this.selectedFormulas.includes(i));
    }
  }

  drawFormula(formulaIndex: number, isSelected: boolean) {
    if (!this.ctx) return;
    const ctx = this.ctx;

    const drawEndPoint = (pointIndex: number) => {
      const point = screenPoints[pointIndex];
      ctx.strokeStyle = (formulaIndex == this.activeFormula && pointIndex == this.activePoint) ? 'red' : 'orange';
      ctx.lineWidth = 3;
      this.drawCircle(point!, 2);
    }

    const dataPoints = this.getFormulaPoints(this.formulas[formulaIndex]!);
    const screenPoints: vec2[] = [];
    for (const dataPoint of dataPoints) {
      screenPoints.push(this.toScreen(dataPoint));
    }
    ctx.strokeStyle = isSelected ? 'orange' : 'black';

    this.drawTriangle(screenPoints, this.activeFormula == formulaIndex);
    
    if (isSelected) {
      drawEndPoint(0);
      drawEndPoint(1);
      drawEndPoint(2);
      drawEndPoint(3);
    }

    if (!isSelected && formulaIndex == this.activeFormula && this.activePoint != null)
      drawEndPoint(this.activePoint);
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
    this.resizeFormulas();
    this.callChangeCallback();
  }
  
  removeFormula = () => {
    if (this.formulas.length - this.selectedFormulas.length < 2) return;
    this.formulas = this.formulas.filter((_formula, index) => !this.selectedFormulas.includes(index));
    this.activeFormula = null;
    this.activePoint = null;
    this.selectedFormulas = [];
    this.resizeFormulas();
    this.callChangeCallback();
  }

}
