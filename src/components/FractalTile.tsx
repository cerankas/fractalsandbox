import { type Fractal } from "@prisma/client";
import React, { useEffect, useRef, useState } from "react";
import { IoColorPaletteOutline } from "react-icons/io5";
import { TbTriangles } from "react-icons/tb";
import IndexedDBManager from "~/logic/cache";
import { type User } from "~/logic/userProvider";
import FractalRenderer from "~/math/fractalRenderer";
import { backgroundColor, oppositeBackgroundColor } from "~/math/palette";

const thumbnailCache = new IndexedDBManager<Blob>("thumbnails", 1);

export default function FractalTile(props: { 
  fractal: Fractal, 
  user: User | undefined, 
  size: number, 
  onmousedown: (button: number, fractal: Fractal) => void, 
  onAuthorClick: (userId: string) => void,
  selected: boolean 
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState("");
  const [hovered, setHovered] = useState(false);
  
  useEffect(() => {
    thumbnailCache.get(props.fractal.id.toString())
    .then(
      blob => setUrl(URL.createObjectURL(blob)), 
      () => {
        const frac = new FractalRenderer({initPriority: 1, drawPriority: 4, onprogress: progress => {
          if (progress >= 1 && canvasRef.current)
            canvasRef.current.toBlob((blob) => {
              if (!blob) throw Error('Eror creating blob from canvas');
              setUrl(URL.createObjectURL(blob));
              void thumbnailCache.put(props.fractal.id.toString(), blob);
            });
        }});
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

  const iconSize = props.size > 180 ? 24 : 24 * props.size / 180;

  return (
    <div className={`fractal-tile relative flex grow justify-center border-2 ${borderStyle} ${hoverStyle}`}
      style={{
        backgroundColor: backgroundColor(props.fractal.color),
        width: `${props.size + 4}px`,
        height: `${props.size + 4}px`,
      }}
      onMouseDown={onmousedown}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url && <img src={url} alt="" style={{userSelect:'none'}} />}
      {!url && <canvas ref={canvasRef} width='300' height='300' className="fractal-tile" onMouseDown={onmousedown} />}
      {hovered && <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {props.user && <img 
          src={props.user.image} alt = ""
          className="absolute left-0 bottom-0 rounded-full cursor-pointer" 
          style={{width: iconSize, height: iconSize, margin: iconSize/6}}
          onClick={() => props.onAuthorClick(props.fractal.authorId)}
          title={props.user.name + ', ' + new Date(props.fractal.createdAt).toISOString().slice(2,10)} 
        />}
        <div className="absolute flex right-0 top-0" style={{color: opCol}}>
          <TbTriangles 
            className="cursor-pointer" 
            style={{width: iconSize, height: iconSize}}
            onClick={() => props.onmousedown(1, props.fractal)}
            title="Load only shape [or middle-click tile]"
            />
          <IoColorPaletteOutline 
            className="cursor-pointer" 
            style={{width: iconSize, height: iconSize}}
            onClick={() => props.onmousedown(2, props.fractal)}
            title="Load only color [or right-click tile]"
          />
        </div>
      </div>}
    </div>
  );
}