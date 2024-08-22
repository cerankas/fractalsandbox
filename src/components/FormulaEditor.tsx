import { useEffect, useMemo, useRef } from "react";
import { TbTriangleMinus, TbTrianglePlus } from "react-icons/tb";
import Formula from "~/math/formula";
import { getBoundingBoxFrom2DArray, getEventOffsetXY, getEventPageXY, getMs } from "~/math/util";
import { findNearestPoint, findNearestSegment } from "~/math/nearest";
import { type vec2, vec2add, vec2sub, vec2angleDifference, vec2magnitudeRatio, vec2mul, vec2magnitude, vec2mul1 } from "~/math/vec2";
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
  activeSubPoint: number | null = null;
  selectedFormulas: number[] = [];
  ctx: CanvasRenderingContext2D | null = null;
  isDragging = false;
  dragStart: vec2 = [0, 0];
  draggedFormulas: Formula[] = [];
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
            this.draggedFormulas = this.selectedFormulas.map(index => this.formulas[index]!.clone());
          }
        }
      }
      else {
        this.isDragging = true;
        this.dragStart = vec2sub(this.manualShift, screenMousePoint);
        this.draggedFormulas = [];
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
    const lastActiveSubPoint = this.activeSubPoint;
    const dataMousePoint = this.fromScreen(getEventOffsetXY(e));
    this.selectActiveFormula(dataMousePoint);
    if (
      lastActiveFormula === this.activeFormula && 
      lastActivePoint === this.activePoint && 
      lastActiveSubPoint === this.activeSubPoint
    ) return;
    this.draw();
  }

  onWindowPointerMove = (e: MouseEvent) => {
    if (!this.ctx) return;
    if (!this.isDragging) return;
    const rect = this.ctx.canvas.getBoundingClientRect();
    const screenMousePoint = vec2sub(getEventPageXY(e), [rect.left, rect.top]);
    if (this.draggedFormulas.length != 0) {
      this.doDragFormula(this.fromScreen(screenMousePoint));
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

  doDragFormula(dataMousePoint: vec2) {
    if (this.activeFormula == null) return;
    const tmpFormulas = this.draggedFormulas.map(formula => formula.clone());
    const activeFormula = tmpFormulas[this.selectedFormulas.indexOf(this.activeFormula)]!;
    const basePoint = activeFormula.iterate([0, 0]);
    const deltaStartMouse = vec2sub(dataMousePoint, this.dragStart);
    const deltaBaseMouse = vec2sub(basePoint, dataMousePoint);
    const deltaBaseStart = vec2sub(basePoint, this.dragStart);
    const angle = vec2angleDifference(deltaBaseStart, deltaBaseMouse);
    const scale = vec2magnitudeRatio(deltaBaseStart, deltaBaseMouse);
    const sub1 = this.activeSubPoint != 2;
    const sub2 = this.activeSubPoint != 1;
    if (this.activePoint == 0) {
      tmpFormulas.map(f => f.shift(vec2mul(deltaStartMouse, [sub1?1:0, sub2?1:0])));
      }
    if (this.activePoint == 3) {
      if (sub2) tmpFormulas.map(f => f.rotate([angle, angle]));
      if (sub1) tmpFormulas.map(f => f.rescale([scale, scale]));
    }
    if (this.activePoint == 1) {
      if (sub2) tmpFormulas.map(f => f.rotate([0, angle]));
      if (sub1) tmpFormulas.map(f => f.rescale([1, scale]));
    }
    if (this.activePoint == 2) {
      if (sub2) tmpFormulas.map(f => f.rotate([angle, 0]));
      if (sub1) tmpFormulas.map(f => f.rescale([scale, 1]));
    }
    this.selectedFormulas.forEach((selected, index) => this.formulas[selected] = tmpFormulas[index]!)
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

  selectActiveFormula(pointer: vec2) {
    if (this.isDragging) return;
    const scaled20 = 20 / this.scale;
    
    if (this.selectedFormulas.length != 0) {
      const points = this.selectedFormulas.map(formula => this.getFormulaPoints(this.formulas[formula]!)).flat();
      const hoveredPoint = findNearestPoint(points, pointer, 20 / this.scale); 
      if (hoveredPoint != null) {
        this.activeFormula = this.selectedFormulas[hoveredPoint / 4 | 0]!;
        this.activePoint = hoveredPoint % 4;
        const start = hoveredPoint - hoveredPoint % 4;
        this.selectActiveSubPoint(points.slice(start, start + 4), pointer);
        return;
      }
    }

    const segments = this.getFractalSegments();
    const hoveredSegment = findNearestSegment(segments as [vec2, vec2][], pointer, scaled20);
    if (hoveredSegment == null) {
      this.activeFormula = null;
      this.activePoint = null;
      return;
    }

    this.activeFormula = hoveredSegment / 4 | 0;
    const points = this.getFormulaPoints(this.formulas[this.activeFormula]!);
    this.activePoint = findNearestPoint(points, pointer, scaled20);
    this.selectActiveSubPoint(points, pointer);
  }

  selectActiveSubPoint(points: vec2[], pointer: vec2) {
    if (this.activePoint == null) return;
    
    const activePoint = points[this.activePoint]!;
    const scaled10 = 10 / this.scale;
    const scaled20 = 20 / this.scale;
    
    if (this.activePoint == 0) {
      const lx = vec2magnitude(vec2sub(points[2]!, points[0]!));
      const ly = vec2magnitude(vec2sub(points[1]!, points[0]!));
      if (lx < scaled20 || ly < scaled20) {
        this.activeSubPoint = null;
        return;
      }
      const subPoints = [activePoint, vec2add(activePoint, [scaled10, 0]), vec2add(activePoint, [0, scaled10])];
      this.activeSubPoint = findNearestPoint(subPoints, pointer, scaled20)!;
    }
    else {
      const delta0 = vec2sub(activePoint, points[0]!);
      const delta = vec2mul1(delta0, scaled10 / vec2magnitude(delta0)); 
      const subPoints = [activePoint, vec2add(activePoint, delta), vec2add(activePoint, [-delta[1], delta[0]])];
      this.activeSubPoint = findNearestPoint(subPoints, pointer, scaled20)!;
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
    this.formulas.forEach((_formula, i) => this.drawFormula(i, this.selectedFormulas.includes(i)));
  }

  drawFormula(formulaIndex: number, isSelected: boolean) {
    const dataPoints = this.getFormulaPoints(this.formulas[formulaIndex]!);
    const screenPoints = dataPoints.map(point => this.toScreen(point));
    
    this.ctx!.strokeStyle = isSelected ? 'orange' : 'black';
    this.drawTriangle(screenPoints, this.activeFormula == formulaIndex);
    
    if (isSelected) {
      const drawEndPoint = (pointIndex: number) => this.drawCircle(
        screenPoints[pointIndex]!,
        (formulaIndex == this.activeFormula && pointIndex == this.activePoint) ? 'red' : 'orange'
      ); 
      drawEndPoint(0);
      drawEndPoint(1);
      drawEndPoint(2);
      drawEndPoint(3);
    }

    if (formulaIndex == this.activeFormula && this.activePoint != null) {
      const pnt = screenPoints[this.activePoint]!;
      this.drawCircle(pnt, ![1,2].includes(this.activeSubPoint!) ? 'red' : 'orange');
      if (this.activeSubPoint != null) {
        let delta: vec2;
        if (this.activePoint == 0) {
          delta = [10, 0];
        }
        else {
          const delta0 = vec2sub(pnt, screenPoints[0]!);
          delta = vec2mul1(delta0, 10 / vec2magnitude(delta0)); 
        }
        this.drawCircle(vec2add(pnt, delta), this.activeSubPoint == 1 ? 'red' : 'orange');
        this.drawCircle(vec2add(pnt, [delta[1], -delta[0]]), this.activeSubPoint == 2 ? 'red' : 'orange');
      }
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

  drawCircle(point: vec2, color: string) {
    this.ctx!.strokeStyle = 'transparent';
    this.ctx!.fillStyle = color;
    this.ctx!.beginPath();
    this.ctx!.arc(point[0], point[1], 4, 0, 2 * Math.PI);
    this.ctx!.fill();
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
