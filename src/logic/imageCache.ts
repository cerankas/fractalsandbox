import { reduceByFrame } from "~/math/fractalRenderer";
import IndexedDBManager from "./cache";
import { loadFractalRangesFromLocalStorage } from "./fractalProvider";

export default class ImageCache {
  imageDbManager = new IndexedDBManager<Int32Array>('images', 1);
  cachedImageSizes = new Map<string, { width: number, height: number }[]>;

  constructor() {
    if (typeof window === 'undefined') return;

    void this.imageDbManager.getAllKeys()
    .then(keys => keys.forEach(key => {
      const [width, height, form] = key.split(':');
      if (!width || !height || !form) throw Error("Invalid key in image cache db")
      this.addCachedImageSize(form, { width: parseFloat(width), height: parseFloat(height) });
    }))
    .then(() => {
      const cachedRanges = loadFractalRangesFromLocalStorage()
      const cachedFractals = cachedRanges.reduce((prevRange, newRange) => prevRange.concat(newRange));
      const cachedForms = new Set(cachedFractals.map(fractal => fractal.form)).add(localStorage.getItem('form') ?? '');
      this.cachedImageSizes.forEach((sizes, form) => {
        if (cachedForms.has(form)) return;
        sizes.forEach(size => void this.imageDbManager.delete(`${size.width}:${size.height}:${form}`));
      });
    });
  }

  private addCachedImageSize(form: string, size: { width: number, height: number }) {
    const sizes = this.cachedImageSizes.get(form);
    if (sizes === undefined)
      this.cachedImageSizes.set(form, [size]);
    else
      sizes.push(size);
  }

  store(form: string, width: number, height: number, data: Int32Array) {
    void this.imageDbManager
    .store(`${width}:${height}:${form}`, data)
    .then(() => this.addCachedImageSize(form, { width: width, height: height}));
  }

  cachedSize(form: string, width: number, height: number) {
    const framedWidth = reduceByFrame(width);
    const framedHeight = reduceByFrame(height);
    
    const cachedSizes = this.cachedImageSizes.get(form);
    return cachedSizes?.filter(size => 
      (size.width === framedWidth && size.height <= framedHeight) || 
      (size.height === framedHeight && size.width <= framedWidth)
    )?.[0] ?? undefined;
  }

  async fetch(form: string, width: number, height: number) {
    return new Promise<{width: number, height: number, data: Int32Array}>((resolve, reject) => {
      const cachedSize = this.cachedSize(form, width, height);
      if (cachedSize !== undefined)
        void this.imageDbManager.fetch(`${cachedSize.width}:${cachedSize.height}:${form}`)
        .then(
          data => resolve({width: cachedSize.width, height: cachedSize.height, data: data}),
          () => reject()
        );
      else
        reject();
    });
  }
  
};