import FractalTile from "./FractalTile";
import { type Fractal } from "@prisma/client";
import { useLocalStorage } from "./browserUtils";
import { useEffect, useRef, useState } from "react";
import { type User } from "~/logic/userProvider";

export default function FractalSelector(props: { 
  fractals: Fractal[], 
  users: User[], 
  loadMore: () => void, 
  onmousedown: (button: number, fractal: Fractal) => void, 
  onAuthorClick: (userId: string) => void,
  selected: number, 
  menu: React.ReactNode, 
  filter: React.ReactNode
}) {
  const [tileSize, setTileSize] = useLocalStorage('tileSize', '180');
  const loaderRef = useRef<HTMLDivElement>(null);
  const [loaderVisible, setLoaderVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { 
      const visible = entry?.isIntersecting ?? false;
      setLoaderVisible(visible);
      if (visible && loaderRef.current?.getAttribute('data-id') === props.fractals.at(-1)?.id.toString()) {
        props.loadMore();
      }
    });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [loaderRef, loaderVisible, props]);

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
            onFocus={(e) => e.target.blur()}
            tabIndex={-1}
            title="Tile size"
          />
          {props.filter}
        </div>
        {props.menu}
      </div>
      <div className="flex flex-wrap overflow-x-clip overflow-y-scroll justify-around">
        { props.fractals.map(f => 
          <div 
            key={f.id} 
            data-id={f.id}
            ref={f.id === props.fractals.at(-1)?.id ? loaderRef : null} 
            className="flex flex-grow"
          >
            <FractalTile 
              fractal={f}
              user={props.users.find(user => user.id === f.authorId)}
              size={parseInt(tileSize) ?? 300} 
              onmousedown={props.onmousedown}
              onAuthorClick={props.onAuthorClick}
              selected={f.id == props.selected}
            />
          </div>)
        }
      </div>
    </div>
  );
}