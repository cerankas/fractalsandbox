import { type vec2 } from "./vec2";

export function floatToShortString(n: number): string {
  const s = parseFloat(n.toFixed(5)).toString();
  return (s.startsWith('0.') || s.startsWith('-0.')) ? s.replace('0.', '.') : s;
};

export function getMs() { return Number(new Date()); }

export function getCanvasCtx(id: string) {
  const canvas = document.getElementById(id) as HTMLCanvasElement;
  return canvas.getContext('2d')!;
}

export function findNearestPoint(points: number[][], point: number[], distanceThreshold: number) {
  function pointDistanceSquared(p1: vec2, p2: vec2) { 
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    return dx * dx + dy * dy;
  }
  let nearestDistance = distanceThreshold * distanceThreshold;
  let nearestIndex = null;
  for (let i = 0; i < points.length; i++) {
    const distance = pointDistanceSquared(points[i] as vec2, point as vec2);
    if (distance < nearestDistance) { nearestDistance = distance; nearestIndex = i; } 
  }
  return nearestIndex;
}

export function getBoundingBoxFrom2DArray(points: number[][]): [min: vec2, max: vec2] {
  let [minx, miny] = [ Infinity,  Infinity];
  let [maxx, maxy] = [-Infinity, -Infinity];
  for (const point of points) {
    const x = point[0]!;
    const y = point[1]!;
    if (x < minx) minx = x;
    if (x > maxx) maxx = x;
    if (y < miny) miny = y;
    if (y > maxy) maxy = y;
  }
  return [[minx, miny], [maxx, maxy]];
}

export function getBoundingBoxFrom1DArray(points: Float64Array): [min: vec2, max: vec2] {
  let [minx, miny] = [ Infinity,  Infinity];
  let [maxx, maxy] = [-Infinity, -Infinity];
  for (let i = 0; i < points.length - 1000; i += 2) {
    const x = points[i]!;
    const y = points[i + 1]!;
    if (x < minx) minx = x;
    if (x > maxx) maxx = x;
    if (y < miny) miny = y;
    if (y > maxy) maxy = y;
  }
  return [[minx, miny], [maxx, maxy]];
}

export function getEventOffsetXY(e: MouseEvent): vec2 { return [e.offsetX, e.offsetY]; }
export function getEventPageXY  (e: MouseEvent): vec2 { return [e.pageX,   e.pageY  ]; }