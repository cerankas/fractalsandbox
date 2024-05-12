import React, { useEffect, useRef } from "react";
import FractalRenderer from "~/math/fractalRenderer";

export default function FractalView(props: { fractal: string, color: string, cached: boolean, onclick?: () => void, hidden?: boolean }) {
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
    if (props.hidden) return;
    if (!fracRef.current) return;
    const frac = fracRef.current;
    frac.setCached(props.cached);
    frac.setFractal(props.fractal);
    frac.setColor(props.color);
    updateCanvasSize();
    console.log('FractalView', fracRef.current?.ctx?.canvas.width)
  }, [props.cached, props.fractal, props.color, props.hidden]);
  
  return (
    <canvas className="size-full"
      ref={canvasRef}
      onContextMenu={e => e.preventDefault()}
      onClick={props.onclick}
    />
  );
}