import FractalView from "./FractalView";
import FractalSelector, { type FormColor } from "./FractalSelector";
import { IoArrowBackCircleOutline, IoArrowForwardCircleOutline } from "react-icons/io5";
import { AiOutlineEdit, AiOutlineFullscreen } from "react-icons/ai";

export default function FractalBrowser(props: { 
  fractals: FormColor[], 
  selectPrev: () => void, 
  selectNext: () => void, 
  onclick: (fractalId: number) => void, 
  selected: number, 
  viewFull: () => void,
  viewEdit: () => void,
  hidden: boolean;
}) {
  const iconStyle = "size-8 hover:cursor-pointer m-1";
  return (
    <div className={"flex p-8 gap-8 h-screen w-screen" + (props.hidden ? " hidden" : "")}>
      <div className="relative aspect-square h-full">
        <div className="absolute top-0 right-0 flex flex-row">
          <IoArrowBackCircleOutline    className={iconStyle} onClick={props.selectPrev} title="Previous [Left]"/>
          <IoArrowForwardCircleOutline className={iconStyle} onClick={props.selectNext} title="Next [Right]"/>
          <AiOutlineEdit               className={iconStyle} onClick={props.viewEdit} title="Edit [Enter]"/>
          <AiOutlineFullscreen         className={iconStyle} onClick={props.viewFull} title="Full screen [Space]"/>
        </div>
        <FractalView
          fractal={props.fractals[props.selected]!.form}
          color={props.fractals[props.selected]!.color}
          cached={false}
          onclick={props.viewFull}
          hidden={props.hidden}
        />
      </div>
      <div className="overflow-hidden">
        <FractalSelector 
            fractals={props.fractals} 
            onclick={props.onclick} 
            selected={props.selected}
          />
      </div>
    </div>
  );
}
