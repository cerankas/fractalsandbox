import React, { useEffect, useRef } from "react";
import Formula from "~/math/formula";
import FractalImageComputer from "~/math/fractalImageComputer";
import type PaletteKey from "~/math/palette";
import { createPaletteFromKeys, paletteKeysFromString } from "~/math/palette";

export default function FractalView(props: { size: number, fractal: string, color: string, cached: boolean, onclick?: () => void }) {
  const canvasRef = useRef(null);
  const fracRef = useRef<FractalImageComputer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current as unknown as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    if (fracRef.current === null) {
      fracRef.current = new FractalImageComputer(ctx, .9);
    }
  }, []);

  useEffect(() => {
    fracRef.current?.setWidthHeight(props.size, props.size);
  }, [props.size]);
  
  useEffect(() => {
    fracRef.current?.setCached(props.cached);
    void fracRef.current?.setFormulas(Formula.formulasFromString(props.fractal));
  }, [props.fractal, props.cached]);
  
  useEffect(() => {
    const palette = createPaletteFromKeys(paletteKeysFromString(props.color) as PaletteKey[]);
    fracRef.current?.setPalette(palette);
  }, [props.color]);

  return (
    <canvas onContextMenu={e => e.preventDefault()}
      ref={canvasRef} 
      width={props.size} 
      height={props.size} 
      onClick={props.onclick}
    />
  );
}