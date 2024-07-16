import React, { useEffect, useMemo, useRef, useState } from "react";
import FractalRenderer from "~/math/fractalRenderer";
import ProgressIndicator from "./ProgressIndicator";
import { backgroundColor } from "~/math/palette";
import { useResizeObserver } from "./browserUtils";

export default function FractalView(props: { form: string, color: string, cached: boolean }) {
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderer = useMemo(() => new FractalRenderer(setProgress), []);

  useResizeObserver(canvasRef, renderer.setCtx);

  useEffect(() => {
    renderer.setCached(props.cached);
    renderer.render();
  }, [renderer, props.cached]);

  useEffect(() => {
    renderer.setForm(props.form);
    renderer.render();
  }, [renderer, props.form]);
  
  useEffect(() => {
    renderer.setColor(props.color);
    renderer.render();
  }, [renderer, props.color]);

  return (
    <div className="size-full" style={{backgroundColor: backgroundColor(props.color)}}>
      
      <div className="absolute top-0 left-0">
        <ProgressIndicator progress={progress} />
      </div>

      <canvas className="size-full"
        ref={canvasRef}
      />
    
    </div>
  );
}