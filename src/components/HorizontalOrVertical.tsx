import React, { useEffect, useState, type ReactNode } from 'react';

export default function HorizontalOrVertical(props: { children: ReactNode, percent: number}) {
  const [isHorizontal, setIsHorizontal] = useState(window.innerWidth >= window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setIsHorizontal(window.innerWidth >= window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`flex p-2 gap-2 ${isHorizontal ? 'flex-row' : 'flex-col'} w-screen h-screen`}>
      {React.Children.map(props.children, (child, index) => (
        <div style={{[isHorizontal ? 'width' : 'height']: `${!index ? props.percent : 100 - props.percent}%` }}>
          {child}
        </div>
      ))}
    </div>
  );
}