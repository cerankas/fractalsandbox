import React from "react";
import FractalView from "./FractalView";

export type FormColor = { form: string, color: string };

export default function FractalTile(props: { id: number, size: number, fractal: string, color: string, onclick?: (fractalId: number) => void, selected: boolean }) {
  return (
    <div className={`flex border-2 bg-white ${props.selected ? "border-black" : ""} hover:border-slate-400`}>
      <FractalView 
        size={props.size} 
        fractal={props.fractal} 
        color={props.color}
        cached={true}
        onclick={props.onclick ? () => { props.onclick!(props.id)} : undefined} 
      />  
    </div>
  );
}