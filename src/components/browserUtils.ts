import { type RefObject, useCallback, useEffect, useLayoutEffect, useState } from "react";

export const isBrowser = typeof window != 'undefined';

export const useBrowserLayoutEffect = isBrowser ? useLayoutEffect : useEffect;

export function useLocalStorage(key: string, initialValue: string): [string, (value: string) => void] {
  const [storedValue, setStoredValue] = useState(() => 
    isBrowser ? window.localStorage.getItem(key) ?? initialValue : initialValue
  );
  
  const setValue = useCallback((value: string) => {
    setStoredValue(value);
    window.localStorage.setItem(key, value);
  }, [key]);
  
  return [storedValue, setValue];
}

export function useHorizontal() {
  const [isHorizontal, setIsHorizontal] = useState(true);

  useEffect(() => {
    const updateHorizontal = () => setIsHorizontal(window.innerWidth >= window.innerHeight);
    updateHorizontal();
    window.addEventListener('resize', updateHorizontal);
    return () => window.removeEventListener('resize', updateHorizontal);
  }, []);
  
  return isHorizontal;
}

export function useResizeObserver(canvasRef: RefObject<HTMLCanvasElement>, callback: (ctx: CanvasRenderingContext2D) => void) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.target === canvas) {
          const { width, height } = entry.contentRect;
          canvas.width = Math.round(width);
          canvas.height = Math.round(height);
          callback(canvas.getContext('2d')!);
        }
      });
    });
    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [canvasRef, callback]);
}

export const iconStyle = "size-6 hover:cursor-pointer m-1";