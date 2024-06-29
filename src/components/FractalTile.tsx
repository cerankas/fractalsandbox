import { type Fractal } from "@prisma/client";
import React, { useEffect, useRef } from "react";
import FractalRenderer from "~/math/fractalRenderer";

export default function FractalTile(props: { fractal: Fractal, size: number, onclick: (fractalId: string) => void, selected: boolean }) {
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
    frac.setFractal(props.fractal.form);
    frac.setColor(props.fractal.color);
    frac.render();
  }, [props.size, props.fractal]);

  return (
    <div className={`flex flex-grow justify-center size-[${props.size}px] box-border border-2 bg-white ${props.selected ? "border-black" : "border-transparent hover:border-slate-200"} `}>
      <canvas
        ref={canvasRef}
        width={props.size}
        height={props.size}
        onClick={() => { props.onclick(props.fractal.id)}}
        />  
    </div>
  );
}