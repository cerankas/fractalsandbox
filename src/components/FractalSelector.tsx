import { useState } from "react";
import FractalTile from "./FractalTile";
import { type Fractal } from "@prisma/client";

export default function FractalSelector(props: { fractals: Fractal[], onclick: (fractalId: number) => void, selected: number, menu: React.ReactNode }) {
  const sizes = [50, 100, 150, 200, 250];
  const [tileSize, setTileSize] = useState(parseInt(localStorage.tileSize as string)??1);
  return (
    <div className="flex flex-col size-full gap-2">
      <div className="flex flex-row bg-white justify-between">
        <input
          className="w-[100px] ml-1 mr-1 accent-gray-500 cursor-pointer"
          type="range"
          min={0}
          max={sizes.length - 1}
          value={tileSize}
          onChange={(e) => { setTileSize(parseInt(e.target.value)); localStorage.tileSize = e.target.value; }}
          title="Tile size"
        />
        {props.menu}
      </div>
      <div className="flex flex-wrap overflow-y-auto justify-around">
        { props.fractals.map(((f) => <FractalTile 
          key={f.id}
          fractal={f}
          size={sizes[tileSize]??50} 
          onclick={() => props.onclick(f.id)}
          selected={f.id == props.selected}
        />)) }
      </div>
    </div>
  );
}