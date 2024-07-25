import React from 'react';

export default function ProgressIndicator(props: { progress: number, color: string }) {
  const rotation = props.progress >= 1 ? 0 : props.progress * 360; // convert percent to degrees, hide if completed

  return (
    <div className="relative size-4 m-2 rounded-full overflow-hidden bg-transparent">
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
      ></div>
    </div>
  );
}