import React, { useEffect, useMemo, useRef, useState } from "react";
import FractalRenderer from "~/math/fractalRenderer";
import ProgressIndicator from "./ProgressIndicator";
import { backgroundColor, oppositeBackgroundColor } from "~/math/palette";
import { useResizeObserver } from "./browserUtils";

export default function FractalView(props: { form: string, color: string, updateCanvasRef?: (canvas: HTMLCanvasElement) => void }) {
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderer = useMemo(() => new FractalRenderer({initPriority: 0, drawPriority: 2, cached: true, onprogress: setProgress}), []);

  useEffect(() => props.updateCanvasRef?.(canvasRef.current!), [props, props.updateCanvasRef])

  useResizeObserver(canvasRef, renderer.setCtx);

  useEffect(() => () => renderer.releaseTask(), [renderer]);

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
        <ProgressIndicator progress={progress} color={oppositeBackgroundColor(props.color)}/>
      </div>

      <canvas className="size-full"
        ref={canvasRef}
      />
    
    </div>
  );
}