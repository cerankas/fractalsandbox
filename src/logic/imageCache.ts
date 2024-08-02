import { reduceByFrame } from "~/math/fractalRenderer";
import IndexedDBManager from "./cache";
import { loadFractalRangesFromLocalStorage } from "./fractalProvider";

export default class ImageCache {
  private imageDbManager = new IndexedDBManager<Int32Array>('images', 1);
  private cachedImageSizes = new Map<string, { width: number, height: number }[]>;
  private initialQueue: (() => void)[] = [];
  private initialized = false;

  constructor() {
    if (typeof window === 'undefined') return;

    void this.imageDbManager.getAllKeys()
    .then(keys => keys.forEach(key => {
      const [width, height, form] = key.split(':');
      if (!width || !height || !form) throw Error("Invalid key in image cache db");
      this.addCachedImageSize(form, { width: parseFloat(width), height: parseFloat(height) });
      this.initialized = true;
    }))
    .then(() => this.initialQueue.forEach(callback => callback()))
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

  private awaitInitialized = async () => new Promise<void>(resolve =>
    this.initialized ? resolve() : this.initialQueue.push(() => resolve())
  );

  private addCachedImageSize(form: string, size: { width: number, height: number }) {
    const sizes = this.cachedImageSizes.get(form);
    if (sizes === undefined)
      this.cachedImageSizes.set(form, [size]);
    else
      sizes.push(size);
  }

  put(form: string, width: number, height: number, data: Int32Array) {
    void this.imageDbManager
    .put(`${width}:${height}:${form}`, data)
    .then(() => this.addCachedImageSize(form, { width: width, height: height}));
  }

  async cachedSize(form: string, width: number, height: number) {
    await this.awaitInitialized();

    const framedWidth = reduceByFrame(width);
    const framedHeight = reduceByFrame(height);
    
    const cachedSizes = this.cachedImageSizes.get(form);
    return cachedSizes?.filter(size => 
      (size.width === framedWidth && size.height <= framedHeight) || 
      (size.height === framedHeight && size.width <= framedWidth)
    )?.[0] ?? undefined;
  }

  async get(form: string, width: number, height: number) {
    const cachedSize = await this.cachedSize(form, width, height);
    return new Promise<{width: number, height: number, data: Int32Array}>((resolve, reject) => {
      if (cachedSize !== undefined)
        void this.imageDbManager.get(`${cachedSize.width}:${cachedSize.height}:${form}`)
        .then(
          data => resolve({width: cachedSize.width, height: cachedSize.height, data: data}),
          () => reject()
        );
      else
        reject();
    });
  }
  
};