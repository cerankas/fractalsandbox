import React, { useEffect, useRef, useState } from "react";
import Formula from "~/math/formula";
import FractalImageComputer from "~/math/fractalImageComputer";
import type PaletteKey from "~/math/palette";
import { createPaletteFromKeys, paletteKeysFromString } from "~/math/palette";

export default function FractalView(props: {size: number, fractal: string, color: string}) {
  const canvasRef = useRef(null);
  const fracRef = useRef<FractalImageComputer | null>(null);
  const [drawStep, setDrawStep] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current as unknown as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    if (fracRef.current === null) {
      fracRef.current = new FractalImageComputer(ctx, .9);
    }
  }, []);

  useEffect(() => {
    fracRef.current?.setWidthHeight(props.size, props.size);
    setDrawStep(0);
  }, [props.size]);
  
  useEffect(() => {
    fracRef.current?.setFormulas(Formula.formulasFromString(props.fractal));
    setDrawStep(0);
  }, [props.fractal]);
  
  useEffect(() => {
    const palette = createPaletteFromKeys(paletteKeysFromString(props.color) as PaletteKey[]);
    fracRef.current?.setPalette(palette);
    setDrawStep(0);
  }, [props.color]);

  useEffect(() => {
    let timerId: NodeJS.Timeout;
    fracRef.current!.processInBackground();
    if (!fracRef.current?.isFinished()) {
      timerId = setTimeout(() => setDrawStep(drawStep + 1), 1);
    }
    return () => clearTimeout(timerId);
  }, [drawStep]);

  return (
    <canvas ref={canvasRef} width={props.size} height={props.size}></canvas>
  );
}