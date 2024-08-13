import React from 'react';

export default function ProgressIndicator(props: { progress: number, color: string, title?: string, onclick?: () => void }) {
  const rotation = props.progress >= 1 ? 0 : props.progress * 360; // convert percent to degrees, hide if completed

  return (
    <div className="relative m-2 rounded-full overflow-hidden bg-transparent" style={{width:16,height:16}}>
      <div 
        className="absolute inset-0"
        style={{
          background: `conic-gradient(
            from 0deg,
            ${props.color} 0deg,
            ${props.color} ${rotation}deg,
            transparent ${rotation}deg,
            transparent 360deg
          )`,
        }}
        onClick={props.onclick}
        title={props.title}
      ></div>
    </div>
  );
}