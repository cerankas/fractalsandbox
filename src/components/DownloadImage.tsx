import { IoCloseCircleOutline } from "react-icons/io5";
import ModalPanel from "./ModalPanel";
import { iconStyle, useLocalStorage } from "./browserUtils";
import { useCallback, useMemo, useState } from "react";
import FractalRenderer from "~/math/fractalRenderer";

export default function DownloadImage(props: {form: string, color: string, download: (canvas: HTMLCanvasElement) => void, close: () => void}) {
  const [width, setWidth] = useLocalStorage('customSaveWidth', 1920);
  const [height, setHeight] = useLocalStorage('customSaveHeight', 1080);
  const [quality, setQuality] = useLocalStorage('customSaveQuality', 100);
  const [progress, setProgress] = useState(0);
  const canvas = useMemo(() => document.createElement('canvas'), []);
  const onProgress = useCallback((progress: number) => {
    setProgress(progress);
    if (progress >= 1) {
      props.download(canvas);
      props.close();
    }
  }, [canvas, props]);
  const renderer = useMemo(() => new FractalRenderer({initPriority: 0, drawPriority: 0, cached: false, onprogress: onProgress}), [onProgress]);

  const inputStyle = "border w-16 rounded-sm m-2 cursor-pointer"

  return <ModalPanel style="fixed flex flex-col w-80 text-black" close={props.close}>
    <IoCloseCircleOutline
      className={iconStyle + " absolute right-0 top-0"}
      onClick={props.close}
    />
    <div>Render and save custom image</div>
    <br/>
    <div className="flex flex-row">
      <label>
        Width:
        <input
          type="number" min={10}
          className={inputStyle}
          value={width}
          onChange={(e) => setWidth(parseInt(e.target.value))}
        />
      </label>
      <label>
        Height:
        <input
          type="number" min={10}
          className={inputStyle}
          value={height}
          onChange={(e) => setHeight(parseInt(e.target.value))}
        />
      </label>
    </div>
    <label>
      Rendering quality (percent):
      <input
        type="number" min={10}
        className={inputStyle}
        value={quality}
        onChange={(e) => setQuality(parseInt(e.target.value))}
      />
    </label>
    <div>{progress ? `Rendering: ${Math.round(progress * 100)}%` : <>&nbsp;</>}</div>
    <div className="flex flex-row justify-end">
      <input
        type="button"
        value="Cancel"
        className={inputStyle}
        onClick={() => { 
          renderer.releaseTask();
          props.close(); 
        }}
      />
      <input
        type="button"
        value="Save"
        className={inputStyle}
        disabled={!!renderer.pointsCount && !renderer.isFinished()}
        onClick={() => { 
          canvas.width = width;
          canvas.height = height;
          renderer.densityPerImage = quality;
          renderer.setCtx(canvas.getContext('2d')!);
          renderer.setColor(props.color);
          renderer.setForm(props.form);
          renderer.render();
         }}
      />
    </div>

  </ModalPanel>;
}