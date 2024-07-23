import { type Fractal } from "@prisma/client";
import React, { useEffect, useRef, useState } from "react";
import IndexedDBManager from "~/logic/cache";
import FractalRenderer from "~/math/fractalRenderer";
import { backgroundColor, oppositeBackgroundColor } from "~/math/palette";

const thumbnailCache = new IndexedDBManager<Blob>("thumbnails", 1);

export default function FractalTile(props: { fractal: Fractal, size: number, onmousedown: (button: number, fractal: Fractal) => void, selected: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mouseOver, setMouseOver] = useState(false);
  const [url, setUrl] = useState("");
  
  useEffect(() => {
    thumbnailCache.fetch(props.fractal.id.toString())
    .then(
      blob => setUrl(URL.createObjectURL(blob)), 
      () => {
        const frac = new FractalRenderer(0, (progress) => {
          if (progress >= 1 && canvasRef.current)
            canvasRef.current.toBlob((blob) => {
              if (!blob) throw new Error('Eror creating blob from canvas');
              setUrl(URL.createObjectURL(blob));
              void thumbnailCache.store(props.fractal.id.toString(), blob)
            });
        });
        frac.setCtx(canvasRef.current!.getContext('2d')!);
        frac.setForm(props.fractal.form);
        frac.setColor(props.fractal.color);
        frac.render();
      }
    );
  }, [props.fractal]);

  return (
    <div
      className={`flex flex-grow relative justify-center box-border border-2 border-transparent hover:border-slate-200`}
      style={{
        backgroundColor: backgroundColor(props.fractal.color),
        borderColor: props.selected ? oppositeBackgroundColor(props.fractal.color) : '',
        width: `${props.size + 4}px`,
        height: `${props.size + 4}px`,
      }}
      onMouseOver={() => setMouseOver(true)}
      onMouseOut={() => setMouseOver(false)}
    >
      {mouseOver && <div className="absolute left-1 bottom-0" style={{userSelect:'none', fontSize:'9px', color: oppositeBackgroundColor(props.fractal.color)}}>
        {`${props.fractal.createdAt.toISOString().slice(0, 10)}`}
      </div>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url && <img src={url} alt="" style={{userSelect:'none'}}
        onMouseDown={(e: React.MouseEvent) => {
          props.onmousedown(e.button, props.fractal);
          e.preventDefault();
          e.stopPropagation();
        }}
      />}
      {!url && <canvas
        ref={canvasRef}
        width={300}
        height={300}
        onMouseDown={(e: React.MouseEvent) => {
          props.onmousedown(e.button, props.fractal);
          e.preventDefault();
          e.stopPropagation();
        }}
      />}
    </div>
  );
}