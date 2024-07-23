import FractalTile from "./FractalTile";
import { type Fractal } from "@prisma/client";
import { useLocalStorage } from "./browserUtils";
import { useCallback, useEffect, useRef, useState } from "react";

export default function FractalSelector(props: { fractals: Fractal[], onmousedown: (button: number, fractal: Fractal) => void, selected: number, menu: React.ReactNode }) {
  const [tileSize, setTileSize] = useLocalStorage('tileSize', '300');
  const loaderRef = useRef<HTMLDivElement>(null);
  const [limit, setLimit] = useState(20);
  const [loaderVisible, setLoaderVisible] = useState(false);

  const increaseLimit = useCallback(() => setLimit(Math.min(limit + 20, props.fractals.length)), [limit, props.fractals.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { 
      const visible = entry?.isIntersecting ?? false;
      setLoaderVisible(visible);
      if (visible) {
        increaseLimit();
      }
    });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [loaderRef, increaseLimit, loaderVisible]);

  return (
    <div className="flex flex-col size-full gap-2">
      <div className="flex flex-row bg-white justify-between">
        <div className="flex flex-row">
          <input
            className="w-[100px] ml-1 mr-1 accent-gray-500 cursor-pointer"
            type="range"
            min={75}
            max={300}
            value={tileSize}
            onChange={(e) => { setTileSize(e.target.value); localStorage.tileSize = e.target.value; }}
            title="Tile size"
          />
        </div>
        {props.menu}
      </div>
      <div className="flex flex-wrap overflow-x-clip overflow-y-scroll justify-around">
        { props.fractals.filter((f, i) => i < limit).map(((f) => <FractalTile 
          key={f.id}
          fractal={f}
          size={parseInt(tileSize) ?? 300} 
          onmousedown={props.onmousedown}
          selected={f.id == props.selected}
        />)) }
        <div className="w-full h-[1px]" ref={loaderRef}></div>
      </div>
    </div>
  );
}