import React, { useCallback, useEffect, useState, type ReactNode } from 'react';

export default function HorizontalOrVertical(props: { children: ReactNode }) {
  const [isHorizontal, setIsHorizontal] = useState(window.innerWidth >= window.innerHeight);
  const [firstComponentPercent, setFirstComponentPercent] = useState(Number(localStorage.getItem('firstComponentPercent')) || 50);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsHorizontal(window.innerWidth >= window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const newSize = 100 * (isHorizontal ? e.clientX / window.innerWidth : e.clientY / window.innerHeight);
        setFirstComponentPercent(Math.max(10, Math.min(90, newSize)));
        localStorage.setItem('firstComponentPercent', newSize.toString());
      }
    },
    [isDragging, isHorizontal]
  );

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove]);

  const children = React.Children.map(props.children, child => child);

  return (
    <div className={`flex p-2 ${isHorizontal ? 'flex-row' : 'flex-col'} w-screen h-screen`}>

      <div style={{[isHorizontal ? 'width' : 'height']: `${firstComponentPercent}%`}}> {children![0]} </div>

      <div className={isHorizontal ? 'w-2 cursor-ew-resize' : 'h-2 cursor-ns-resize'} onMouseDown={handleMouseDown}></div>

      <div style={{[isHorizontal ? 'width' : 'height']: `calc(${100 - firstComponentPercent}% - 8px)` }}> {children![1]} </div>

    </div>
  );
}