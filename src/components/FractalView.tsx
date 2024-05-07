import React, { useEffect, useRef } from "react";
import FractalRenderer from "~/math/fractalRenderer";

export default function FractalView(props: { fractal: string, color: string, cached: boolean, onclick?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fracRef = useRef<FractalRenderer | null>(null);
  if (fracRef.current === null) {
    fracRef.current = new FractalRenderer();
  }

  useEffect(() => {
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const updateCanvasSize = () => {
    const frac = fracRef.current;
    if (!frac) return;
    const canvas = canvasRef.current!;
    const { width, height } = canvas.parentElement!.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;
    frac.setCtx(canvas.getContext('2d')!);
    frac.touch();
    frac.render();
  };

  useEffect(() => {
    const frac = fracRef.current;

    if (!frac) return;
    frac.setCached(props.cached);
    frac.setFractal(props.fractal);
    frac.setColor(props.color);
    updateCanvasSize();
  }, [props.cached, props.fractal, props.color]);
  
  return (
    <canvas className="size-full"
      ref={canvasRef}
      onContextMenu={e => e.preventDefault()}
      onClick={props.onclick}
    />
  );
}