import React, { useEffect, useMemo, useRef } from "react";
import FractalRenderer from "~/math/fractalRenderer";
import { backgroundColor } from "~/math/palette";
import { useResizeObserver } from "./browserUtils";

export default function FractalView(props: { form: string, color: string, updateCanvasRef?: (canvas: HTMLCanvasElement) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderer = useMemo(() => new FractalRenderer({initPriority: 0, drawPriority: 2, cached: true}), []);

  useEffect(() => props.updateCanvasRef?.(canvasRef.current!), [props, props.updateCanvasRef])

  useResizeObserver(canvasRef, renderer.setCtx);

  useEffect(() => () => renderer.releaseTask(), [renderer]);

  useEffect(() => {
    renderer.setForm(props.form);
    renderer.setColor(props.color);
    renderer.render();
  }, [renderer, props.form, props.color]);
  
  return (
    <div className="size-full" style={{backgroundColor: backgroundColor(props.color)}}>
      
      <canvas className="size-full"
        ref={canvasRef}
      />
    
    </div>
  );
}