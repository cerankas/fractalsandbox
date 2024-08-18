import { useEffect } from "react";

export default function ModalPanel(props: {style: string, close: () => void, children: React.ReactNode}) {
  useEffect(() => {
    const closeOnEscape = (e: KeyboardEvent) => { 
      if (e.key === 'Escape') props.close();
      e.stopPropagation(); 
    }
    document.addEventListener('keydown', closeOnEscape, true);
    return () => document.removeEventListener('keydown', closeOnEscape, true);
  }, [props]);

  return <>
    <div className="fixed inset-0 z-40 bg-black opacity-50 " onClick={props.close}/>
    <div className={"rounded z-50 border-2 bg-white border-black p-2 " + props.style}>
      {props.children}
    </div>
  </>;
  
}