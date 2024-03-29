export default class PaletteKey {
  static PALETTE_LENGTH = 1000;
  static MAX_KEY_INDEX = 1000;
  
  constructor(
    public index: number, 
    public r: number, 
    public g: number, 
    public b: number
  ) {}
}

export function createPaletteFromKeys(keys: PaletteKey[]) {
  function linearCombination(v1: number, v2: number, coeff: number) { return v1 * (1 - coeff) + v2 * coeff; }
  function mergeRGBA(r: number, g: number, b: number, a: number) { return (r << 0) + (g << 8) + (b << 16) + (a << 24); }
  keys.sort((a: PaletteKey, b: PaletteKey) => a.index == b.index ? 0 : (a.index < b.index ? - 1: 1));
  const palette = [];
  const firstKey = keys[0]!;
  const lastKey = keys[keys.length - 1]!;
  for (let i = 0; i <= firstKey.index; i++)
    palette.push(mergeRGBA(firstKey.r, firstKey.g, firstKey.b, 0xff));
  for (let i = 1; i < keys.length; i++) {
    const prevKey = keys[i - 1]!;
    const nextKey = keys[i]!;
    const indexDifference = nextKey.index - prevKey.index;
    if (indexDifference == 0)
      continue;
    for (let j = prevKey.index + 1; j <= nextKey.index; j++) {
      const coefficient = (j - prevKey.index) / indexDifference;
      const r = linearCombination(prevKey.r, nextKey.r, coefficient);
      const g = linearCombination(prevKey.g, nextKey.g, coefficient);
      const b = linearCombination(prevKey.b, nextKey.b, coefficient);
      palette.push(mergeRGBA(r, g, b, 0xff));
    }
  }
  for (let i = lastKey.index + 1; i < PaletteKey.MAX_KEY_INDEX; i++)
    palette.push(mergeRGBA(lastKey.r, lastKey.g, lastKey.b, 0xff));
  return palette;
}

function componentToHex(c: number) {
  const hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

export function rgbToHex(r: number, g: number, b: number) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

export function paletteKeysFromString(string: string): unknown {
  return string.split(',').map(s => {
    const [indstr, rgbstr] = s.split(' ') as [string, string];
    const ind = (parseFloat(indstr) * PaletteKey.MAX_KEY_INDEX) | 0;
    const rgb = hexToRGB(rgbstr);
    return new PaletteKey(ind, ...rgb);
  });
}

export function paletteKeysToString(paletteKeys: PaletteKey[]) {
  return paletteKeys.map(k => `${k.index} ${rgbToHex(k.r, k.g, k.b)}`).join(';');
}

export function hexToRGB(hex: string): [number, number, number  ] {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return [r, g, b];
}