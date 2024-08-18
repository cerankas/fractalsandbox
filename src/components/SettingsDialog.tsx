import { IoCloseCircleOutline } from "react-icons/io5";
import { iconStyle } from "./browserUtils";
import FractalRenderer from "~/math/fractalRenderer";
import ModalPanel from "./ModalPanel";

export default function SettingsDialog(props: {slideShowPeriod: number, setSlideShowPeriod: (interval: number) => void, close: () => void}) {
  const buttonStyle = "border w-40 rounded m-2"

  return <ModalPanel style="fixed inset-24 flex flex-col" close={props.close}>
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
  </ModalPanel>;
}