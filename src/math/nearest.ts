import { vec2dotProduct, vec2magnitudeSquared, vec2sub, type vec2 } from "./vec2";

export function findNearestPoint(points: vec2[], pointer: vec2, distanceThreshold: number) {
  return findNearest<vec2>(points, pointer, distanceThreshold, pointDistanceSquared);
}

export function findNearestSegment(segments: [vec2, vec2][], pointer: vec2, distanceThreshold: number) {
  return findNearest<[vec2, vec2]>(segments, pointer, distanceThreshold, segmentDistanceSquared);
}

function findNearest<T>(items: T[], pointer: vec2, distanceThreshold: number, itemDistance: (item: T, point: vec2) => number) {
  let nearestDistance = distanceThreshold ** 2;
  let nearestIndex = null;

  items.forEach((item, i) =>  {
    const distance = itemDistance(item, pointer);
    if (distance < nearestDistance) { 
      nearestDistance = distance; 
      nearestIndex = i; 
    } 
  });
  
  return nearestIndex;
}

function pointDistanceSquared(p1: vec2, p2: vec2) { 
  return vec2magnitudeSquared(vec2sub(p1, p2));
}

function segmentDistanceSquared(segment: [vec2, vec2], point: vec2) {
  const [segmentStart, segmentEnd] = segment;

   const segmentVector: vec2 = [
      segmentEnd[0] - segmentStart[0], 
      segmentEnd[1] - segmentStart[1]
  ];

  const pointVector: vec2 = [
      point[0] - segmentStart[0], 
      point[1] - segmentStart[1]
  ];

  const segmentLengthSquared = vec2dotProduct(segmentVector, segmentVector);
  const projection = vec2dotProduct(pointVector, segmentVector) / segmentLengthSquared;

  if (projection <= 0) return pointDistanceSquared(point, segmentStart);
  if (projection >= 1) return pointDistanceSquared(point, segmentEnd);

  const closestPoint: vec2 = [
      segmentStart[0] + projection * segmentVector[0],
      segmentStart[1] + projection * segmentVector[1]
  ];

  return pointDistanceSquared(point, closestPoint);
}