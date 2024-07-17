import { type Fractal } from "@prisma/client";
import React, { useEffect, useRef } from "react";
import FractalRenderer from "~/math/fractalRenderer";
import { backgroundColor, oppositeBackgroundColor } from "~/math/palette";

export default function FractalTile(props: { fractal: Fractal, size: number, onmousedown: (button: number, fractal: Fractal) => void, selected: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fracRef = useRef<FractalRenderer | null>(null);
  if (fracRef.current === null) {
    fracRef.current = new FractalRenderer();
  }
  
  useEffect(() => {
    const frac = fracRef.current;
    if (!frac) return;
    frac.setCtx(canvasRef.current!.getContext('2d')!);
    frac.setCached(true);
    frac.setForm(props.fractal.form);
    frac.setColor(props.fractal.color);
    frac.render();
  }, [props.size, props.fractal]);

  return (
    <div
      className={`flex flex-grow justify-center box-border border-2 border-transparent hover:border-slate-200`}
      style={{
        backgroundColor: backgroundColor(props.fractal.color),
        borderColor: props.selected ? oppositeBackgroundColor(props.fractal.color) : '',
        width: `${props.size + 4}px`,
        height: `${props.size + 4}px`,
      }}
    >
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        onMouseDown={(e: React.MouseEvent) => {
          props.onmousedown(e.button, props.fractal);
          e.preventDefault();
          e.stopPropagation();
        }}
      />  
    </div>
  );
}