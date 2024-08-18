import { useEffect } from "react";
import { IoCloseCircleOutline } from "react-icons/io5";
import { iconStyle } from "./browserUtils";
import FractalRenderer from "~/math/fractalRenderer";

export default function SettingsDialog(props: {slideShowPeriod: number, setSlideShowPeriod: (interval: number) => void, close: () => void}) {
  useEffect(() => {
    const closeOnEscape = (e: KeyboardEvent) => { 
      if (e.key === 'Escape') props.close();
      e.stopPropagation(); 
    }
    document.addEventListener('keydown', closeOnEscape, true);
    return () => document.removeEventListener('keydown', closeOnEscape, true);
  }, [props]);

  const buttonStyle = "border w-40 rounded-sm m-2"

  return <>
    <div className="fixed inset-0 z-40 bg-black opacity-50" onClick={props.close}/>
    <div className="fixed inset-24 flex flex-col rounded z-50 border-2 bg-white border-black p-2">
      <IoCloseCircleOutline
        className={iconStyle + " absolute right-0 top-0"}
        onClick={props.close}
      />
      Settings (build {process.env.NEXT_PUBLIC_BUILD_TIMESTAMP?.slice(0,10)})
      <label>
        Slideshow period (in seconds):
        <input
          type="number" min={1}
          className={buttonStyle}
          style={{width:60}}
          value={props.slideShowPeriod / 1000}
          onChange={(e) => props.setSlideShowPeriod(parseFloat(e.target.value) * 1000)}
          />
      </label>
      <div className="flex flex-row">
        <input
          type="button"
          value="Clear fractal cache"
          className={buttonStyle}
          onClick={() => { localStorage.removeItem("fractalCache"); location.reload(); }}
        />
        <input
          type="button"
          value="Clear image cache"
          className={buttonStyle}
          onClick={() => void FractalRenderer.imageCache.clearStore().then(() => location.reload())}
        />
      </div>
    </div>
  </>;
}