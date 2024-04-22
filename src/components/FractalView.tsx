import React, { useEffect, useRef } from "react";
import Formula from "~/math/formula";
import FractalImageComputer from "~/math/fractalImageComputer";
import type PaletteKey from "~/math/palette";
import { createPaletteFromKeys, paletteKeysFromString } from "~/math/palette";

export type FormColor = { form: string, color: string };

export default function FractalView(props: {size: number, id: number, fractal: string, color: string, onclick: ((fractalId: number) => void) | null, selected: boolean }) {
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
    void fracRef.current?.setFormulas(Formula.formulasFromString(props.fractal)); // todo: investigate, possibly use .then
  }, [props.fractal]);
  
  useEffect(() => {
    const palette = createPaletteFromKeys(paletteKeysFromString(props.color) as PaletteKey[]);
    fracRef.current?.setPalette(palette);
  }, [props.color]);

  return (
    <canvas 
      ref={canvasRef} 
      width={props.size} 
      height={props.size} 
      className={`flex border-2 bg-white ${props.selected ? "border-black" : ""} hover:border-slate-400`}
      onClick={props.onclick ? 
        () => { props.onclick!(props.id)} : 
        undefined
      }
    />
  );
}