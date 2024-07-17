import FractalTile from "./FractalTile";
import { type Fractal } from "@prisma/client";
import { useLocalStorage } from "./browserUtils";

export default function FractalSelector(props: { fractals: Fractal[], onmousedown: (button: number, fractal: Fractal) => void, selected: number, menu: React.ReactNode }) {
  const [tileSize, setTileSize] = useLocalStorage('tileSize', '300');
  return (
    <div className="flex flex-col size-full gap-2">
      <div className="flex flex-row bg-white justify-between">
        <div className="flex flex-row">
          <input
            className="w-[100px] ml-1 mr-1 accent-gray-500 cursor-pointer"
            type="range"
            min={100}
            max={300}
            value={tileSize}
            onChange={(e) => { setTileSize(e.target.value); localStorage.tileSize = e.target.value; }}
            title="Tile size"
          />
        </div>
        {props.menu}
      </div>
      <div className="flex flex-wrap overflow-x-clip overflow-y-auto justify-around">
        { props.fractals.map(((f) => <FractalTile 
          key={f.id}
          fractal={f}
          size={parseInt(tileSize) ?? 300} 
          onmousedown={props.onmousedown}
          selected={f.id == props.selected}
        />)) }
      </div>
    </div>
  );
}