import { IoCloseCircleOutline } from "react-icons/io5";
import ModalPanel from "./ModalPanel";
import { iconStyle, useLocalStorage } from "./browserUtils";
import { useCallback, useMemo, useRef, useState } from "react";
import FractalRenderer from "~/math/fractalRenderer";
import { interpolateColors, interpolateForms } from "~/math/interpolate";
import { Muxer, ArrayBufferTarget } from "mp4-muxer";

let globFrameNumber = 0;

export default function DownloadVideo(props: {start: {form: string, color: string}, end: {form: string, color: string}, close: () => void}) {
  const [width, setWidth] = useLocalStorage('videoWidth', 1920);
  const [height, setHeight] = useLocalStorage('videoHeight', 1080);
  const [quality, setQuality] = useLocalStorage('videoQuality', 100);
  const [duration, setDuration] = useLocalStorage('videoDuration', 5);
  const [fps, setFps] = useLocalStorage('videoFps', 30);
  const [frameProgress, setFrameProgress] = useState(0);
  const [frameNumber, setFrameNumber] = useState(0);
  const canvas = useMemo(() => document.createElement('canvas'), []);
  const rendererRef = useRef<FractalRenderer | null>(null);
  const encoderRef = useRef<VideoEncoder | null>(null);
  const muxerRef = useRef<Muxer<ArrayBufferTarget> | null>(null);

  const finalize = useCallback(async () => {
    await encoderRef.current!.flush();
    muxerRef.current!.finalize();
  
    const buffer = muxerRef.current!.target.buffer;
    const blob = new Blob([buffer]);
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'fractalsandbox.mp4';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);

    props.close();
  }, [props]);
  
  const onProgress = useCallback((progress: number) => {
    if (!rendererRef.current) return;
    if (!encoderRef.current) return;
    setFrameProgress(progress);
    if (progress >= 1) {
      const frame = new VideoFrame(canvas, {
        timestamp: globFrameNumber * 1e6 / fps,
        duration: 1e6 / fps
      });
    
      encoderRef.current.encode(frame, { keyFrame: false });
      frame.close();
    
      globFrameNumber++;
      setFrameNumber(globFrameNumber);

      if (globFrameNumber <= duration * fps) {
        const phase = globFrameNumber / duration / fps;
        rendererRef.current.setForm(interpolateForms(props.start.form, props.end.form, phase));
        rendererRef.current.setPalette(interpolateColors(props.start.color, props.end.color, phase));
        rendererRef.current.render();
      }
      else {
        void finalize();
      }
    }
  }, [canvas, duration, finalize, fps, props]);
  
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


          muxerRef.current = new Muxer({
            target: new ArrayBufferTarget(),
        
            video: {
              codec: 'avc',
              width: canvas.width,
              height: canvas.height,
              frameRate: fps
            },
            fastStart: 'in-memory',
          });
        
          encoderRef.current = new VideoEncoder({
            output: (chunk, meta) => muxerRef.current!.addVideoChunk(chunk, meta),
            error: e => console.error(e)
          });

          encoderRef.current.configure({
            codec: 'avc1.42002a',
            width: canvas.width,
            height: canvas.height,
            bitrate: 1e8
          });
          
         }}
      />
    </div>

  </ModalPanel>;
}