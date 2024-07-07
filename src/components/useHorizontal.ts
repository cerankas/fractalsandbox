import { useEffect, useState } from 'react';

export default function useHorizontal() {
  const [isHorizontal, setIsHorizontal] = useState(true);
  useEffect(() => {
    const updateHorizontal = () => setIsHorizontal(window.innerWidth >= window.innerHeight);
    updateHorizontal();
    window.addEventListener('resize', updateHorizontal);
    return () => window.removeEventListener('resize', updateHorizontal);
  }, []);
  return isHorizontal;
}