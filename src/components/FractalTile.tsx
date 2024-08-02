import { type Fractal } from "@prisma/client";
import React, { useEffect, useRef, useState } from "react";
import IndexedDBManager from "~/logic/cache";
import FractalRenderer from "~/math/fractalRenderer";
import { backgroundColor, oppositeBackgroundColor } from "~/math/palette";

const thumbnailCache = new IndexedDBManager<Blob>("thumbnails", 1);

export default function FractalTile(props: { fractal: Fractal, size: number, onmousedown: (button: number, fractal: Fractal) => void, selected: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState("");
  
  useEffect(() => {
    thumbnailCache.get(props.fractal.id.toString())
    .then(
      blob => setUrl(URL.createObjectURL(blob)), 
      () => {
        const frac = new FractalRenderer(false, 0, progress => {
          if (progress >= 1 && canvasRef.current)
            canvasRef.current.toBlob((blob) => {
              if (!blob) throw Error('Eror creating blob from canvas');
              setUrl(URL.createObjectURL(blob));
              void thumbnailCache.put(props.fractal.id.toString(), blob);
            });
        });
        frac.setCtx(canvasRef.current!.getContext('2d')!);
        frac.setForm(props.fractal.form);
        frac.setColor(props.fractal.color);
        frac.render();
      }
    );
  }, [props.fractal]);
  
  const opCol = oppositeBackgroundColor(props.fractal.color);
  const borderStyle = props.selected ? (opCol === 'white' ? 'border-white' : 'border-black') : 'border-transparent';
  const hoverStyle = props.selected ? 'hover:border-slate-500' : (opCol === 'white' ? 'hover:border-slate-400' : 'hover:border-slate-600');

  const onmousedown = (e: React.MouseEvent) => {
    props.onmousedown(e.button, props.fractal);
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className={`flex flex-grow justify-center border-2 ${borderStyle} ${hoverStyle}`}
      style={{
        backgroundColor: backgroundColor(props.fractal.color),
        width: `${props.size + 4}px`,
        height: `${props.size + 4}px`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url && <img src={url} alt="" style={{userSelect:'none'}} onMouseDown={onmousedown} />}
      {!url && <canvas ref={canvasRef} width={300} height={300} onMouseDown={onmousedown} />}
    </div>
  );
}