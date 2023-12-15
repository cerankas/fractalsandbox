// Palette

class PaletteKey {
  static PALETTE_LENGTH = 1000;
  static MAX_KEY_INDEX = 1000;
  
  constructor(index, r, g, b) {
    this.index = index;
    this.r = r;
    this.g = g;
    this.b = b;
  }
}


function createPaletteFromKeys(keys) {
  function linearCombination(v1, v2, coeff) { return v1 * (1 - coeff) + v2 * coeff; }
  function mergeRGBA(r, g, b, a) { return (r << 0) + (g << 8) + (b << 16) + (a << 24); }
  keys.sort(function(a, b){if (a.index < b.index) return -1; return a.index > b.index;});
  const palette = [];
  const firstKey = keys[0];
  const lastKey = keys[keys.length - 1];
  for (let i = 0; i <= firstKey.index; i++)
    palette.push(mergeRGBA(firstKey.r, firstKey.g, firstKey.b, 0xff));
  for (let i = 1; i < keys.length; i++) {
    const prevKey = keys[i - 1];
    const nextKey = keys[i];
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

function componentToHex(c) {
  let hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function paletteKeysFromString(string) {
  return JSON.parse(string);
}

function paletteKeysToString(paletteKeys) {
  return JSON.stringify(paletteKeys);
}

function hexToRGB(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}