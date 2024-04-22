export type vec2 = [x: number, y: number];

export function vec2add(u: vec2, v: vec2): vec2 { return [u[0] + v[0], u[1] + v[1]]; }
export function vec2sub(u: vec2, v: vec2): vec2 { return [u[0] - v[0], u[1] - v[1]]; }
export function vec2mul(u: vec2, v: vec2): vec2 { return [u[0] * v[0], u[1] * v[1]]; }
export function vec2div(u: vec2, v: vec2): vec2 { return [u[0] / v[0], u[1] / v[1]]; }
  
export function vec2add1(u: vec2, v: number): vec2 { return [u[0] + v, u[1] + v]; }
export function vec2sub1(u: vec2, v: number): vec2 { return [u[0] - v, u[1] - v]; }
export function vec2mul1(u: vec2, v: number): vec2 { return [u[0] * v, u[1] * v]; }
export function vec2div1(u: vec2, v: number): vec2 { return [u[0] / v, u[1] / v]; }

export function vec2rotate(v: vec2, angle: number): vec2 {
  angle *= Math.PI / 180;
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const x = v[0];
  const y = v[1];
  return [
    x * cos - y * sin,
    x * sin + y * cos
  ];
}

export function vec2angle(v: vec2) {
  return Math.atan2(v[1], v[0]) * 180 / Math.PI;
}

export function vec2angleDifference(u: vec2, v: vec2) {
  let angle = vec2angle(v) - vec2angle(u);
  if (angle >   180) angle -= 360;
  if (angle <= -180) angle += 360;
  return angle;
}

export function vec2magnitude(v: vec2) {
  const x = v[0];
  const y = v[1];
  return Math.sqrt(x * x + y * y);
}

export function vec2magnitudeRatio(u: vec2, v: vec2) {
  return vec2magnitude(v) / vec2magnitude(u) || 1;
}