import Formula from "./formula";
import { createPaletteFromKeys, linearCombination, mergeRGBA, paletteKeysFromString, splitRGBA } from "./palette";
import { type vec2 } from "./vec2";

export const interpolateArrays = (a1: number[], a2: number[], phase: number) => a1.map((a, i) => linearCombination(a, a2[i]!, phase));

export function interpolateForms(form1: string, form2: string, phase: number) {
  const ff1 = Formula.fromString(form1);
  const ff2 = Formula.fromString(form2);

  if (ff1.length != ff2.length) throw Error('Trying to interpolate fractals with different numbers of formulas')

  return Formula.toString(ff1.map((f1, i) => {
    const f2 = ff2[i]!;
    const f = new Formula;
    f.rotation = interpolateArrays(f1.rotation, f2.rotation, phase) as vec2;
    f.scale = interpolateArrays(f1.scale, f2.scale, phase) as vec2;
    f.translation = interpolateArrays(f1.translation, f2.translation, phase) as vec2;
    return f;
  }));
}

export function interpolateColors(color1: string, color2: string, phase: number) {
  const p1 = createPaletteFromKeys(paletteKeysFromString(color1)).map(v => splitRGBA(v));
  const p2 = createPaletteFromKeys(paletteKeysFromString(color2)).map(v => splitRGBA(v));

  return p1.map((p, i) => interpolateArrays(p, p2[i]!, phase)).map(v => mergeRGBA(v as [number, number, number]));
}

export function interpolateFractals(start: {form: string, color: string}, end: {form: string, color: string}, phase: number) {
  return {
    form: interpolateForms(start.form, end.form, phase), 
    color: interpolateColors(start.color, end.color, phase)
  };
}