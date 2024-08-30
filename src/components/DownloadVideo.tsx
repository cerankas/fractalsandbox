import { IoCloseCircleOutline } from "react-icons/io5";
import ModalPanel from "./ModalPanel";
import { iconStyle, useLocalStorage } from "./browserUtils";
import { useCallback, useMemo, useRef, useState } from "react";
import FractalRenderer from "~/math/fractalRenderer";
import { Recorder, RecorderStatus } from "canvas-record";
import { AVC } from "media-codecs";
import { interpolateColors, interpolateForms } from "~/math/interpolate";
// import { WebCodecsEncoder } from "canvas-record/encoder";

let globFrameNumber = 0;

export default function DownloadVideo(props: {start: {form: string, color: string}, end: {form: string, color: string}, close: () => void}) {
  const [width, setWidth] = useLocalStorage('videoWidth', 1920);
  const [height, setHeight] = useLocalStorage('videoHeight', 1080);
  const [quality, setQuality] = useLocalStorage('videoQuality', 100);
  const [duration, setDuration] = useLocalStorage('videoDuration', 5);
  const [fps, setFps] = useLocalStorage('videoFps', 25);
  const [frameProgress, setFrameProgress] = useState(0);
  const [frameNumber, setFrameNumber] = useState(0);
  const canvas = useMemo(() => document.createElement('canvas'), []);
  const rendererRef = useRef<FractalRenderer | null>(null);
  const recorderRef = useRef<Recorder | null>(null);
  
  const onProgress = useCallback((progress: number) => {
    if (!recorderRef.current) return;
    if (!rendererRef.current) return;
    if (recorderRef.current.status !== RecorderStatus.Recording) return;
    setFrameProgress(progress);
    if (progress >= 1) {      
      void recorderRef.current.step();
      globFrameNumber++;
      setFrameNumber(globFrameNumber);
      if (globFrameNumber > duration * fps) {
        props.close();
      }
      else {
        const phase = globFrameNumber / duration / fps;
        rendererRef.current.setForm(interpolateForms(props.start.form, props.end.form, phase));
        rendererRef.current.setColor(interpolateColors(props.start.color, props.end.color, phase));        
        rendererRef.current.render();
      }
    }
  }, [duration, fps, props]);
  
  const inputStyle = "border w-16 rounded m-2 cursor-pointer"

  return <ModalPanel style="fixed flex flex-col w-80 text-black" close={props.close}>
    <IoCloseCircleOutline
      className={iconStyle + " absolute right-0 top-0"}
      onClick={props.close}
    />
    <div>Render and save video</div>
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
    <label>
      Video duration (seconds):
      <input
        type="number" min={1}
        className={inputStyle}
        value={duration}
        onChange={(e) => setDuration(parseInt(e.target.value))}
      />
    </label>
    <label>
      Video frames per second:
      <input
        type="number" min={5}
        className={inputStyle}
        value={fps}
        onChange={(e) => setFps(parseInt(e.target.value))}
      />
    </label>
    <div>{frameProgress || frameNumber ? `Rendering frame ${frameNumber} / ${duration * fps}: ${Math.round(frameProgress * 100)}%` : <>&nbsp;</>}</div>
    <div className="flex flex-row justify-end">
      <input
        type="button"
        value="Cancel"
        className={inputStyle}
        onClick={() => { 
          rendererRef.current?.releaseTask();
          props.close(); 
        }}
      />
      <input
        type="button"
        value="Save"
        className={inputStyle}
        disabled={!!rendererRef.current?.pointsCount && !rendererRef.current?.isFinished()}
        onClick={() => { 
          globFrameNumber = 0;
          canvas.width = width;
          canvas.height = height;
          rendererRef.current = new FractalRenderer({initPriority: 0, drawPriority: 0, cached: false, onprogress: onProgress})
          rendererRef.current.densityPerImage = quality;
          rendererRef.current.setCtx(canvas.getContext('2d', {willReadFrequently: true})!);
          rendererRef.current.setColor(props.start.color);
          rendererRef.current.setForm(props.start.form);
          rendererRef.current.render();

          recorderRef.current = new Recorder(rendererRef.current.ctx!, {
            name: "canvas-record-example",
            duration: duration,
            frameRate: fps,
            encoderOptions: {
              codec: AVC.getCodec({ profile: "Main", level: "5.2" }),
            },
          });
            
          void recorderRef.current.start();
         }}
      />
    </div>

  </ModalPanel>;
}