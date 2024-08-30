import { IoCloseCircleOutline } from "react-icons/io5";
import { iconStyle } from "./browserUtils";
import FractalRenderer from "~/math/fractalRenderer";
import ModalPanel from "./ModalPanel";
import { useEffect, useMemo, useRef, useState } from "react";
import { backgroundColor, oppositeBackgroundColor } from "~/math/palette";
import { interpolateColors, interpolateForms } from "~/math/interpolate";

export default function InterpolateDialog(props: {size: {width: number, height: number}, start: {form: string, color: string}, end: {form: string, color: string}, close: () => void}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderer = useMemo(() => new FractalRenderer({initPriority: 0, drawPriority: 2, cached: true}), []);
  const [phase, setPhase] = useState(0);
  const [form, setForm] = useState(props.start.form);
  const [color, setColor] = useState(props.start.color);

  useEffect(() => () => renderer.releaseTask(), [renderer]);

  useEffect(() => {
    renderer.setCtx(canvasRef.current!.getContext('2d')!);
  }, [renderer]);

  useEffect(() => {
    renderer.setForm(form);
    renderer.setColor(color);
    console.log(color)
    renderer.render();
  }, [renderer, form, color]);
  
  return <ModalPanel style="fixed left-0 top-0 border-0" close={props.close}>
    <canvas className="relative size-full"
      style={{backgroundColor: backgroundColor(color)}}
      ref={canvasRef}
      width={props.size.width}
      height={props.size.height}
    />
    <IoCloseCircleOutline
      className={iconStyle + " absolute right-0 top-0 m-2"}
      style={{color:oppositeBackgroundColor(color)}}
      onClick={props.close}
    />
    <input
      className="absolute left-0 top-0 w-[200px] m-2 accent-gray-500 cursor-pointer"
      type="range"
      min={0}
      max={1}
      step={.001}
      value={phase}
      onChange={e => {
        const phase = parseFloat(e.target.value);
        setPhase(phase);
        setForm(interpolateForms(props.start.form, props.end.form, phase));
        setColor(interpolateColors(props.start.color, props.end.color, phase));
      }}
      onFocus={e => e.target.blur()}
      tabIndex={-1}
      title="Interpolation phase"
    />
  </ModalPanel>;
}