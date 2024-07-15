import FractalTile from "./FractalTile";
import { type Fractal } from "@prisma/client";
import { MdRefresh } from "react-icons/md";
import { iconStyle } from "./browserUtils";
import { useLocalStorage } from "./browserUtils";

export default function FractalSelector(props: { fractals: Fractal[], onmousedown: (button: number, fractal: Fractal) => void, selected: number, menu: React.ReactNode, refreshCallback?: () => void }) {
  const sizes = [50, 100, 150, 200, 250];
  const [tileSize, setTileSize] = useLocalStorage('tileSize', '1');
  return (
    <div className="flex flex-col size-full gap-2">
      <div className="flex flex-row bg-white justify-between">
        <div className="flex flex-row">
          <input
            className="w-[100px] ml-1 mr-1 accent-gray-500 cursor-pointer"
            type="range"
            min={0}
            max={sizes.length - 1}
            value={tileSize}
            onChange={(e) => { setTileSize(e.target.value); localStorage.tileSize = e.target.value; }}
            title="Tile size"
          />
          <MdRefresh className={iconStyle} onClick={props.refreshCallback} title="Refresh"/>
        </div>
        {props.menu}
      </div>
      <div className="flex flex-wrap overflow-x-clip overflow-y-auto justify-around">
        { props.fractals.map(((f) => <FractalTile 
          key={f.id}
          fractal={f}
          size={sizes[parseInt(tileSize)] ?? 50} 
          onmousedown={props.onmousedown}
          selected={f.id == props.selected}
        />)) }
      </div>
    </div>
  );
}