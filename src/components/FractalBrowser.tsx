import FractalView from "./FractalView";
import FractalSelector, { type FormColor } from "./FractalSelector";
import { IoArrowBackCircleOutline, IoArrowForwardCircleOutline } from "react-icons/io5";
import { AiOutlineEdit, AiOutlineFullscreen } from "react-icons/ai";
import HorizontalOrVertical from "./HorizontalOrVertical";

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
  const iconStyle = "size-6 hover:cursor-pointer m-1";
  return (
    <div className={props.hidden ? " hidden" : ""}>
      <HorizontalOrVertical percent={50}>
        <div className="relative size-full">
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
        <div className="size-full">
          <FractalSelector 
            fractals={props.fractals} 
            onclick={props.onclick} 
            selected={props.selected}
          />
        </div>
      </HorizontalOrVertical>
    </div>
  );
}
