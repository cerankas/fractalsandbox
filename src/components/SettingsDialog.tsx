import { useEffect } from "react";
import { IoCloseCircleOutline } from "react-icons/io5";
import { iconStyle } from "./browserUtils";

export default function SettingsDialog(props: {slideShowPeriod: number, setSlideShowPeriod: (interval: number) => void, close: () => void}) {
  useEffect(() => {
    const closeOnEscape = (e: KeyboardEvent) => { 
      if (e.key === 'Escape') props.close();
      e.stopPropagation(); 
    }
    document.addEventListener('keydown', closeOnEscape, true);
    return () => document.removeEventListener('keydown', closeOnEscape, true);
  }, [props]);
  
  return <>
    <div className="fixed inset-0 z-40 bg-black opacity-50" onClick={props.close}/>
    <div className="fixed inset-24 flex flex-col rounded z-50 border-2 bg-white border-black p-2">
      <IoCloseCircleOutline
        className={iconStyle + " absolute right-0 top-0"}
        onClick={props.close}
      />
      Settings (build {process.env.NEXT_PUBLIC_BUILD_TIMESTAMP?.slice(0,10)})<br/>
      <br/>
      <label>
        Slideshow period (in seconds): &nbsp;
        <input
          type="number" min={1}
          style={{width:60}}
          value={props.slideShowPeriod / 1000}
          onChange={(e) => props.setSlideShowPeriod(parseFloat(e.target.value) * 1000)}
        />
      </label>
    </div>
  </>;
}