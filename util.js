// Utils

import glob from "./global.js"
import Vec from './vector.js'

export function getMilliseconds() { return Number(new Date()); }

export function downloadImage() {
  document.getElementById('download').href = document.getElementById('canvasFrac').toDataURL('image/png');
  document.getElementById('download').click();
}

export function saveFractal() {
  const key = 'fractal#' + new Date().toISOString();
  localStorage.setItem(key, glob.FractalEditor.formulas.toString());
}

export function loadFractal(fract) {
  glob.FractalSelector.hide();
  glob.FractalEditor.loadFormulas(fract);
  glob.FractalViewer.resetToAuto();
  glob.FractalViewer.setFormulas(glob.FractalEditor.formulas);
}
window.loadFractal = loadFractal;

export function toggleDisplay(id) {
  const el = document.getElementById(id);
  const newstate = el.style['display'] == 'none';
  el.style['display'] = newstate ? '' : 'none';
  return newstate;
}

export function getCanvasCtx(id) {
  return document.getElementById(id).getContext('2d');
}

export function findNearestPoint(points, point, distanceThreshold) {
  function pointDistanceSquared(p1, p2) { 
    const delta = Vec.from(p1).sub(p2);
    return delta[0] * delta[0] + delta[1] * delta[1];
  }
  let nearestDistance = distanceThreshold * distanceThreshold;
  let nearestIndex = null;
  for (let i = 0; i < points.length; i++) {
    const distance = pointDistanceSquared(points[i], point);
    if (distance < nearestDistance) { nearestDistance = distance; nearestIndex = i; } 
  }
  return nearestIndex;
}

export function getBoundingBoxFrom2DArray(points) {
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  for (let i = 0; i < points.length; i++) {
    const x = points[i][0], y = points[i][1];
    if (x < minx) minx = x; if (x > maxx) maxx = x;
    if (y < miny) miny = y; if (y > maxy) maxy = y;
  }
  return [Vec.from([minx, miny]), Vec.from([maxx, maxy])];
}

export function getBoundingBoxFrom1DArray(points) {
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  for (let i = 0; i < points.length - 1000; i += 2) {
    const x = points[i], y = points[i + 1];
    if (x < minx) minx = x; if (x > maxx) maxx = x;
    if (y < miny) miny = y; if (y > maxy) maxy = y;
  }
  return [Vec.from([minx, miny]), Vec.from([maxx, maxy])];
}

export function getEventOffsetXY(e) { return [e.offsetX, e.offsetY]; }

export function getEventPageXY(e) { return [e.pageX, e.pageY]; }