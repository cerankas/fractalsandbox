import { useEffect, useMemo, useRef, useState } from "react";
import { IoColorPaletteOutline } from "react-icons/io5";
import { TbTriangleMinus, TbTrianglePlus } from "react-icons/tb";
import Formula from "~/math/formula";
import { findNearestPoint, getBoundingBoxFrom2DArray, getEventOffsetXY, getEventPageXY } from "~/math/util";
import { type vec2, vec2add, vec2sub, vec2angleDifference, vec2magnitudeRatio, vec2mul } from "~/math/vec2";
import Viewport from "~/math/viewport";
import { iconStyle, useResizeObserver } from "./browserUtils";
import PaletteEditor from "./PaletteEditor";
import { AiOutlineQuestionCircle } from "react-icons/ai";

export default function FormulaEditor(props: { form: string, color: string, formCallback: (form: string) => void, colorCallback: (color: string) => void, menu: React.ReactNode }) {
  const [showPalette, setShowPalette] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gui = useMemo(() => new FormulaEditorGUI(props.formCallback), [props.formCallback]);

  useEffect(() => gui.loadFormulas(props.form), [gui, props.form]);

  useResizeObserver(canvasRef, gui.setCtx);

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.key === "c") setShowPalette(!showPalette);
      if (e.key === "Insert") gui.addFormula();
      if (e.key === "Delete") gui.removeFormula(); 
    };
    document.addEventListener('keydown', keyDownHandler);
    return () => { document.removeEventListener('keydown', keyDownHandler); }
  }, [gui, showPalette]);

  return (<>
    <div className="relative size-full">
      <div className="absolute top-0 left-0 right-0 flex flex-row justify-between">
        <div></div>
        <div className="flex flex-row">
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
          <AiOutlineQuestionCircle
            className={iconStyle}
            onClick={() => console.log(gui.formulas, props.form, gui.selectedFormula)}
            title="Info"
          />
          <IoColorPaletteOutline 
            className={iconStyle}
            onClick={() => setShowPalette(!showPalette)}
            title="Colors [c]"
          />
          {props.menu}
        </div>
      </div>
      <canvas className="size-full" ref={canvasRef} />
    </div>
    {showPalette && <PaletteEditor color={props.color} changeCallback={props.colorCallback}/>}
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
    if (this.isDragging) return;
    const dataMousePoint = this.fromScreen(getEventOffsetXY(e));
    this.selectNearestFormula(dataMousePoint);
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
    if (this.selectedPoint == 2) {
      e.shiftKey || tmpFormula.rotate([angle, angle]);
      e.ctrlKey || tmpFormula.rescale([scale, scale]);
    }
    if (this.selectedPoint == 1) {
      e.shiftKey || tmpFormula.rotate([0, angle]);
      e.ctrlKey || tmpFormula.rescale([1, scale]);
    }
    if (this.selectedPoint == 3) {
      e.shiftKey || tmpFormula.rotate([angle, 0]);
      e.ctrlKey || tmpFormula.rescale([scale, 1]);
    }
    this.formulas[this.selectedFormula] = tmpFormula;
  }

  callChangeCallback() {
    const form = Formula.toString(this.formulas);
    this.changeCallback(form);
  }

  loadFormulas(formulaString: string) {
    this.formulas = Formula.fromString(formulaString);
    if (!this.isDragging) {
      this.selectedFormula = this.formulas.length - 1;
      this.selectedPoint = null;
      this.resetToAuto();
      this.resizeFormulas();
    }
  }

  selectNearestFormula(point: vec2) {
    const fractalPoints = this.getFractalPoints();
    const nearestIndex = findNearestPoint(fractalPoints, point, 20 / this.scale);
    if (nearestIndex != null) {
      this.selectedFormula = fractalPoints[nearestIndex]![2]!;
      this.selectedPoint   = fractalPoints[nearestIndex]![3]!;
    }
    else {
      this.selectedPoint = null;
    }
  }

  getFormulaPoints(formulaIndex: number) {
    const formula = this.formulas[formulaIndex]!;
    const formulaPoints = [];
    const formulaVectors: vec2[] = [
      [ 0, 0],
      [ 0, 1],
      [ 1, 0],
      [-1, 0]
    ];
    for (const vector of formulaVectors) {
      formulaPoints.push(formula.iterate(vector));
    }
    return formulaPoints;
  }
  
  getFractalPoints() {
    const fractalPoints = [];
    for (let formulaIndex = 0; formulaIndex < this.formulas.length; formulaIndex++) {
      const formulaPoints = this.getFormulaPoints(formulaIndex);
      for (let pointIndex = 0; pointIndex < formulaPoints.length; pointIndex++) {
        fractalPoints.push(formulaPoints[pointIndex]!.concat([formulaIndex, pointIndex]));
      }
    }
    return fractalPoints;
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
    this.callChangeCallback();
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
      this.drawFormula(i, false, 0);
    }
    this.drawFormula(this.selectedFormula, true, this.selectedPoint!);
  }

  drawFormula(formulaIndex: number, isSelected: boolean, selectedPoint: number) {
    if (!this.ctx) return;
    function drawEndPoint(th: FormulaEditorGUI, pointIndex: number, size: number) {
      const point = screenPoints[pointIndex];
      ctx.strokeStyle = (pointIndex == selectedPoint) ? 'red' : 'orange';
      ctx.lineWidth = 2;
      th.drawCircle(point!, 1 + size);
    }
    const dataPoints = this.getFormulaPoints(formulaIndex);
    const screenPoints: vec2[] = [];
    for (const dataPoint of dataPoints) {
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
  
  drawBaseFormula() {
    this.ctx!.strokeStyle = 'lightgrey';
    this.drawTriangle([
      this.toScreen([ 0, 0]),
      this.toScreen([ 0, 1]),
      this.toScreen([ 1, 0]),
      this.toScreen([-1, 0])
    ]);
  }

  drawTriangle(points: vec2[]) {
    this.ctx!.beginPath();
    this.moveTo(points[0]!);
    this.lineTo(points[1]!);
    this.lineTo(points[2]!);
    this.lineTo(points[3]!);
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
    this.callChangeCallback();
  }
  
  removeFormula = () => {
    if (this.formulas.length < 3) return;
    this.formulas.splice(this.selectedFormula, 1);
    this.callChangeCallback();
  }

}
