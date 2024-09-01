import { floatToShortString } from "./util";

export const PALETTE_MAX_INDEX = 10000;

export class PaletteKey {
  
  constructor(
    public level: number,
    public rgb: [number, number, number]
  ) {}
}

export function createPaletteFromKeys(keys: PaletteKey[]) {
  function linearCombination(v1: number, v2: number, coeff: number) { return v1 * (1 - coeff) + v2 * coeff; }
  function mergeRGBA(c: [number, number, number]) { return (c[0] << 0) + (c[1] << 8) + (c[2] << 16) + (0xff << 24); }
  const sortedKeys = [...keys].sort((a: PaletteKey, b: PaletteKey) => a.level == b.level ? 0 : (a.level < b.level ? - 1: 1));
  const palette = [];
  const firstKey = sortedKeys[0]!;
  const lastKey = sortedKeys[sortedKeys.length - 1]!;
  for (let i = 0; i <= firstKey.level; i++)
    palette.push(mergeRGBA(firstKey.rgb));
  for (let i = 1; i < sortedKeys.length; i++) {
    const prevKey = sortedKeys[i - 1]!;
    const nextKey = sortedKeys[i]!;
    const indexDifference = nextKey.level - prevKey.level;
    if (indexDifference == 0)
      continue;
    for (let j = prevKey.level + 1; j <= nextKey.level; j++) {
      const coefficient = (j - prevKey.level) / indexDifference;
      palette.push(mergeRGBA([
        linearCombination(prevKey.rgb[0], nextKey.rgb[0], coefficient),
        linearCombination(prevKey.rgb[1], nextKey.rgb[1], coefficient),
        linearCombination(prevKey.rgb[2], nextKey.rgb[2], coefficient)
      ]));
    }
  }
  for (let i = lastKey.level + 1; i <= PALETTE_MAX_INDEX; i++)
    palette.push(mergeRGBA(lastKey.rgb));
  return palette;
}

export function rgbToHex(color: [number, number, number]) {
  const componentToHex = (component: number) => {
    const hex = component.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }
  
  return color.map(c => componentToHex(c)).join('');
}

export function hexToRGB(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return [r, g, b];
}

export function paletteKeysFromString(paletteString: string) {
  return paletteString.split(';').map(s => {
    const [indstr, rgbstr] = s.split(',') as [string, string];
    const ind = (parseFloat(indstr) * PALETTE_MAX_INDEX) | 0;
    const rgb = hexToRGB(rgbstr);
    return new PaletteKey(ind, rgb);
  });
}

export function paletteKeysToString(paletteKeys: PaletteKey[]) {
  return [...paletteKeys]
    .sort((a: PaletteKey, b: PaletteKey) => a.level == b.level ? 0 : (a.level < b.level ? - 1: 1))
    .map(key => {
      const index = floatToShortString(key.level / PALETTE_MAX_INDEX);
      const color = rgbToHex(key.rgb);
      return `${index},${color}`;
    })
    .join(';');
}

export function backgroundColor(paletteString: string) {
  return '#' + rgbToHex(paletteKeysFromString(paletteString)[0]!.rgb);
}

export function oppositeColor(rgb: [number, number, number]) {
  return rgb[0] + rgb[1] + rgb[2] > 1.5 * 0xff ? 'black' : 'white';
}

export function oppositeBackgroundColor(paletteString:string) {
  return oppositeColor(paletteKeysFromString(paletteString)[0]!.rgb);
}