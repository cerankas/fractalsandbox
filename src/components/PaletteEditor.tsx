import { useEffect, useMemo, useRef, useState } from "react";
import { PaletteKey, createPaletteFromKeys, paletteKeysFromString, paletteKeysToString, rgbToHex,hexToRGB,  PALETTE_LENGTH } from "~/math/palette";
import { findNearestPoint, getMs } from "~/math/util";
import { HexColorPicker } from "react-colorful"
import { useResizeObserver } from "./browserUtils";

export default function PaletteEditor(props: { color: string, changeCallback: (color: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedKeyIndex, setSelectedKeyIndex] = useState<number | null>(null);
  const gui = useMemo(() => new PaletteEditorGUI(props.changeCallback, setSelectedKeyIndex), [props.changeCallback]);

  useResizeObserver(canvasRef, gui.setCtx);

  useEffect(() => gui.loadPalette(props.color), [gui, props.color]);

  return (<>
    {selectedKeyIndex !== null && selectedKeyIndex < gui.paletteKeys.length && <div 
      className="absolute bottom-10"
      style={{left: gui.m + (window.innerWidth - 160 - 2*gui.m) * gui.paletteKeys[selectedKeyIndex]!.level / PALETTE_LENGTH}}
      >
      <HexColorPicker
        color={'#' + rgbToHex(gui.paletteKeys[selectedKeyIndex]!.rgb)}
        onChange={(newColor) => {
          gui.paletteKeys[selectedKeyIndex]!.rgb = hexToRGB(newColor.slice(1));
          gui.palette = createPaletteFromKeys(gui.paletteKeys);
          gui.callChangeCallback();
        }}
        />
    </div>}
    <div className="absolute left-0 right-0 bottom-0 h-10">
      <canvas className="size-full"
        ref={canvasRef} 
        onMouseOut={() => gui.setNearestKeyIndex(null)}
      />
    </div>
  </>);
}

class PaletteEditorGUI {
  m = 8;
  mx = 0;
  ctx: CanvasRenderingContext2D | null = null;
  paletteKeys: PaletteKey[] = [];
  palette: number[] = [];
  nearestKeyIndex: number | null = null;
  selectedKeyIndex: number | null = null;
  isDragging = false;
  skipToggleSelected = false;
  lastChangeCallbackTime = 0;
  callbackTimeout: NodeJS.Timeout | undefined;

  constructor(
    public changeCallback: (color: string) => void, 
    public selectCallback: (index: number | null) => void)
  {
    window.addEventListener('pointermove', this.onWindowPointerMove);
    window.addEventListener('pointerup',   this.onWindowPointerUp);
  }

  loadPalette(palette: string) {
    if (!palette) console.error('no palette in loadPalette');
    if (getMs() - this.lastChangeCallbackTime < 100) return;
    this.paletteKeys = paletteKeysFromString(palette);
    this.palette = createPaletteFromKeys(this.paletteKeys);
    this.setNearestKeyIndex(null, false);
    this.setSelectedKeyIndex(null, false);
    this.draw();
  }
  
  selectNearestColor(x: number, redraw = true) {
    this.setNearestKeyIndex(findNearestPoint(this.paletteKeys.map((key) => [this.getXFromLevel(key.level), 0]), [x, 0], 20), redraw);
  }
  
  setNearestKeyIndex(index: number | null, redraw = true) {
    if (this.nearestKeyIndex === index || this.isDragging) return;
    this.nearestKeyIndex = index;
    if (redraw) this.draw();
  }

  setSelectedKeyIndex(index: number | null, redraw = true) {
    if (this.selectedKeyIndex === index || this.isDragging) return;
    this.selectedKeyIndex = index;
    this.selectCallback(this.selectedKeyIndex);
    if (redraw) this.draw();
  }  
  
  setCtx = (ctx: CanvasRenderingContext2D) => {
    this.ctx = ctx;
    ctx.canvas.addEventListener('pointerdown', this.onPointerDown);
    ctx.canvas.addEventListener('pointermove', this.onPointerMove);
    this.draw();
  }

  getLevelFromX(x: number) {
    if (x < this.m) x = this.m;
    if (x >= this.mx) x = this.mx;
    return ((x - this.m) * PALETTE_LENGTH / (this.mx - this.m)) | 0;
  }

  getXFromLevel(i: number) {
    return this.m + (this.mx - this.m) * i / PALETTE_LENGTH;
  }  
  
  addColor(level: number) {
    let newIndex = 0;
    while (newIndex < this.paletteKeys.length - 1 && this.paletteKeys[newIndex]!.level < level) newIndex++;
    const rgb = this.palette[level]!;
    const newKey = new PaletteKey(level, [rgb & 0xff, (rgb >> 8) & 0xff, (rgb >> 16) & 0xff]);
    this.paletteKeys.splice(newIndex, 0, newKey);
    this.palette = createPaletteFromKeys(this.paletteKeys);
    return newIndex;
  }
  
  removeColor(index: number) {
    this.paletteKeys.splice(index, 1);
    this.palette = createPaletteFromKeys(this.paletteKeys);
  }
  
  onPointerDown = (e: MouseEvent) => {
    this.selectNearestColor(e.offsetX);
    if (e.button == 0 || e.button == 1) {
      this.skipToggleSelected = false;
      if (this.nearestKeyIndex === null || e.button == 1) {
        const level = this.getLevelFromX(e.offsetX);
        const newIndex = this.addColor(level);
        this.setNearestKeyIndex(newIndex, false);
        this.callChangeCallback();
        this.skipToggleSelected = true;
      }
      if (this.selectedKeyIndex !== null && this.selectedKeyIndex != this.nearestKeyIndex) {
        this.setSelectedKeyIndex(this.nearestKeyIndex);
        this.skipToggleSelected = true;
      } 
      this.isDragging = true;
    }
    if (e.button == 2) {
      if (this.nearestKeyIndex !== null && this.paletteKeys.length > 2) {
        this.removeColor(this.nearestKeyIndex);
        if (this.selectedKeyIndex !== null && this.selectedKeyIndex >= this.nearestKeyIndex && this.selectedKeyIndex > 0) {
          this.setSelectedKeyIndex(this.selectedKeyIndex - 1, false);
        }
        this.selectNearestColor(e.offsetX, false);
        this.callChangeCallback();
      }
    }
  }

  onPointerMove = (e: MouseEvent) => {
    if (this.isDragging || e.buttons) return;
    this.selectNearestColor(e.offsetX);
  }

  onWindowPointerMove = (e: MouseEvent) => {
    if (!this.isDragging) return;
    this.skipToggleSelected = true;
    this.paletteKeys[this.nearestKeyIndex!]!.level = this.getLevelFromX(e.pageX);
    this.palette = createPaletteFromKeys(this.paletteKeys);
    this.callChangeCallback();
  }

  onWindowPointerUp = () => {
    if (!this.isDragging) return;
    this.isDragging = false;
    if (!this.skipToggleSelected) {
      this.setSelectedKeyIndex(this.selectedKeyIndex === null ? this.nearestKeyIndex : null, false);
    }
    const key = this.paletteKeys[this.nearestKeyIndex!]!;
    this.paletteKeys.sort((a: PaletteKey, b: PaletteKey) => a.level == b.level ? 0 : (a.level < b.level ? -1 : 1));
    this.setNearestKeyIndex(this.paletteKeys.findIndex((k) => k === key), false);
    if (this.selectedKeyIndex !== null) this.setSelectedKeyIndex(this.nearestKeyIndex, false);
    this.callChangeCallback();
  }

  callChangeCallback() {
    clearTimeout(this.callbackTimeout);
    this.callbackTimeout = setTimeout(() => {
      this.lastChangeCallbackTime = getMs();
      this.changeCallback(paletteKeysToString(this.paletteKeys));
    }, 10);
    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    if (!ctx) return;
    const m = this.m;
    this.mx = ctx.canvas.width - m;
    ctx.lineWidth = 1;
    
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (let x = m; x <= this.mx; x++) {
      const i = this.getLevelFromX(x);
      const rgb = this.palette[i]!;
      ctx.fillStyle = "#" + rgbToHex([rgb & 0xff, (rgb >> 8) & 0xff, (rgb >> 16) & 0xff]);
      ctx.fillRect(x, m, 1, ctx.canvas.height - 2*m);
    }

    const dash = (x: number, color: string, nearest: boolean, selected: boolean) => {
      ctx.lineWidth = nearest ? 6 : 2;
      ctx.strokeStyle = color;
      const d = 6;
      ctx.beginPath();
      ctx.moveTo(x - d, m);
      ctx.lineTo(x, d + m);
      ctx.lineTo(x + d, m);
      if (selected) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, d + m);
      }
      ctx.stroke();
    };

    const sortedPaletteKeys = this.paletteKeys
    .map((key, i): [PaletteKey, number] => [key, i])
    .sort(([a, _ai], [b, _bi]) => a.level == b.level ? 0 : a.level < b.level ? -1 : 1);
    
    for (const [key, i] of sortedPaletteKeys) {
      const x = this.getXFromLevel(key.level);
      const c = key.rgb;
      const blackOrWhite = ((c[0] + c[1] + c[2]) > (1.5 * 0xff)) ? 'black' : 'white';
      dash(x, blackOrWhite, i === this.nearestKeyIndex, i === this.selectedKeyIndex);
    }
  }

}
