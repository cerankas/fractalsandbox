import { useState } from "react";
import FractalTile from "./FractalTile";

export type FormColor = { form: string, color: string };

export default function FractalSelector(props: { fractals: FormColor[], onclick: (fractalId: number) => void, selected: number }) {
  const sizes = [50, 100, 150, 200, 250];
  const [tileSize, setTileSize] = useState(parseInt(localStorage.tileSize as string)??1);
  return (
    <>
      <div className="flex text-xl p-2">
        Fractal Sandbox &nbsp;&nbsp;&nbsp;&nbsp;
        <input
          type="range"
          min={0}
          max={sizes.length - 1}
          value={tileSize}
          onChange={(e) => { setTileSize(parseInt(e.target.value)); localStorage.tileSize = e.target.value; }}
        />
      </div>
      <div className="flex flex-row flex-wrap">
        { props.fractals.map(((f,i) => <FractalTile 
          key={i} 
          id={i}
          size={sizes[tileSize]??50} 
          fractal={f.form} 
          color={f.color} 
          onclick={() => props.onclick(i)}
          selected={i == props.selected}
        />)) }
      </div>
    </>
  );
}