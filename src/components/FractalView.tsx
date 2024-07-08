import React, { useEffect, useRef, useState } from "react";
import FractalRenderer from "~/math/fractalRenderer";
import ProgressIndicator from "./ProgressIndicator";
import { backgroundColor } from "~/math/palette";

export default function FractalView(props: { form: string, color: string, cached: boolean, hidden?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<FractalRenderer | null>(null);
  const [progress, setProgress] = useState(0);

  if (rendererRef.current === null) {
    rendererRef.current = new FractalRenderer(setProgress);
    console.log("create FractalRenderer")
  }

  const updateCanvasSize = () => {
    const renderer = rendererRef.current!;
    const canvas = canvasRef.current!;
    const parent = canvas.parentElement!.getBoundingClientRect();
    if (canvas.width != (parent.width | 0) || canvas.height != (parent.height | 0)) {
      canvas.width = parent.width;
      canvas.height = parent.height;
    }
    renderer.setCtx(canvas.getContext('2d')!);
    renderer.touch();
    renderer.render();
    console.log('updateCanvasSize FractalView', rendererRef.current?.ctx?.canvas.width)
  };

  useEffect(() => {
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  useEffect(() => {
    if (props.hidden) return;
    const renderer = rendererRef.current!;
    renderer.setCached(props.cached);
    renderer.setFractal(props.form);
    renderer.setColor(props.color);
    updateCanvasSize();
    console.log('FractalView', rendererRef.current?.ctx?.canvas.width)
  }, [props.cached, props.form, props.color, props.hidden]);

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