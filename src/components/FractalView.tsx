import React, { useEffect, useRef, useState } from "react";
import FractalRenderer from "~/math/fractalRenderer";
import ProgressIndicator from "./ProgressIndicator";

export default function FractalView(props: { fractal: string, color: string, cached: boolean, onclick?: () => void, hidden?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fracRef = useRef<FractalRenderer | null>(null);
  const [progress, setProgress] = useState(0);
  if (fracRef.current === null) {
    fracRef.current = new FractalRenderer(setProgress);
  }

  useEffect(() => {
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const updateCanvasSize = () => {
    const frac = fracRef.current;
    if (!frac) return;
    const canvas = canvasRef.current!;
    const parent = canvas.parentElement!.getBoundingClientRect();
    if (canvas.width != (parent.width | 0) || canvas.height != (parent.height | 0)) {
      canvas.width = parent.width;
      canvas.height = parent.height;
    }
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
    <div className="size-full">
      
      <div className="absolute top-0 left-0">
        <ProgressIndicator progress={progress} />
      </div>

      <canvas className="size-full"
        ref={canvasRef}
        onClick={props.onclick}
        />
    
    </div>
  );
}