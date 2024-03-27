// Utils

export function getMs() { return Number(new Date()); }

export function getCanvasCtx(id: string) {
  const canvas = document.getElementById(id) as HTMLCanvasElement;
  return canvas.getContext('2d')!;
}

export function findNearestPoint(points: number[][], point: number[], distanceThreshold: number) {
  function pointDistanceSquared(p1: [number, number], p2: [number, number]) { 
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    return dx * dx + dy * dy;
  }
  let nearestDistance = distanceThreshold * distanceThreshold;
  let nearestIndex = null;
  for (let i = 0; i < points.length; i++) {
    const distance = pointDistanceSquared(points[i] as [number, number], point as [number, number]);
    if (distance < nearestDistance) { nearestDistance = distance; nearestIndex = i; } 
  }
  return nearestIndex;
}

export function getBoundingBoxFrom2DArray(points: number[][]): [number, number, number, number] {
  let minx = Infinity;
  let miny = Infinity;
  let maxx = -Infinity;
  let maxy = -Infinity;
  for (const point of points) {
    const x = point[0]!;
    const y = point[1]!;
    if (x < minx) minx = x;
    if (x > maxx) maxx = x;
    if (y < miny) miny = y;
    if (y > maxy) maxy = y;
  }
  return [minx, miny, maxx, maxy];
}

export function getBoundingBoxFrom1DArray(points: Float64Array): [number, number, number, number] {
  let minx = Infinity;
  let miny = Infinity;
  let maxx = -Infinity;
  let maxy = -Infinity;
  for (let i = 0; i < points.length - 1000; i += 2) {
    const x = points[i]!;
    const y = points[i + 1]!;
    if (x < minx) minx = x;
    if (x > maxx) maxx = x;
    if (y < miny) miny = y;
    if (y > maxy) maxy = y;
  }
  return [minx, miny, maxx, maxy];
}
