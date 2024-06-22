import { useState } from "react";
import FormulaEditor from "./FormulaEditor";
import FractalView from "./FractalView";
import { IoArrowBackCircleOutline, IoArrowForwardCircleOutline, IoCloseCircleOutline, IoCloudUploadOutline } from "react-icons/io5";
import { api } from "~/utils/api";
import { AiOutlineQuestionCircle } from "react-icons/ai";
import HorizontalOrVertical from "./HorizontalOrVertical";

export default function FractalEditor(props: { size: number, fractal: string, color: string, returnCallback: () => void, selectPrev: () => void, selectNext: () => void }) {
  const [fractal, setFractal] = useState(props.fractal);
  const { mutate } = api.fractalCreate.create.useMutation({ onSuccess: (data) => { alert("Uploaded " + data.id); }});
  const iconStyle = "size-6 hover:cursor-pointer m-1";
  
  const [propFractal, setPropFractal] = useState('');
  if (propFractal != props.fractal) {
    setPropFractal(props.fractal);
    setFractal(props.fractal);
  }

  const modified = (fractal !== props.fractal);

  return (
    <HorizontalOrVertical percent={50}>
      <div className="relative size-full">
        <div className="absolute top-0 right-0 flex flex-row">
          <IoCloudUploadOutline        className={iconStyle + (modified ? "" : " text-gray-500 hover:cursor-auto")} onClick={() => modified && mutate({form: fractal, color: props.color})} title="Upload"/>
          <IoArrowBackCircleOutline    className={iconStyle} onClick={props.selectPrev}/>
          <IoArrowForwardCircleOutline className={iconStyle} onClick={props.selectNext}/>
          <IoCloseCircleOutline        className={iconStyle} onClick={props.returnCallback} title="Exit [Esc]"/>
          <AiOutlineQuestionCircle     className={iconStyle} onClick={() => {alert(fractal.replaceAll(',','\n') + "\n\n" + props.fractal.replaceAll(',','\n'))}}/>
        </div>
        <FractalView
          fractal={fractal}
          color={props.color}
          cached={!modified}
        />
      </div>
      <div className="size-full">
        <FormulaEditor 
          fractal={props.fractal}
          changeCallback={(fractal) => {setFractal(fractal);}}
        />
      </div>
    </HorizontalOrVertical>
  );
}