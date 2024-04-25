import { useState } from "react";
import FormulaEditor from "./FormulaEditor";
import FractalView from "./FractalView";

export default function FractalEditor(props: { size: number, fractal: string, color: string, returnCallback: () => void }) {
  const [fractal, setFractal] = useState(props.fractal)
  return (
    <div className="m-auto flex gap-20">
      <FormulaEditor 
        size={800}
        fractal={props.fractal}
        changeCallback={(fractal: string) => {setFractal(fractal);}}
      />
      <FractalView
        size={800}
        fractal={fractal}
        color={props.color}
        cached={true}
      />
    </div>);
}