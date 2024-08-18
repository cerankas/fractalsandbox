import IndexedDBManager from "./cache";
import { providedFractalRanges } from "./fractalProvider";
import {gzipSync, gunzipSync} from 'fflate';

export default class ImageCache {
  private imageDbManager = new IndexedDBManager<{ data: Uint8Array, resumeData: string }>('images', 2);
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
    }))
    .finally(() => {
      this.initialized = true;
      this.initialQueue.forEach(callback => callback());

      const cachedFractals = providedFractalRanges.reduce((prevRange, newRange) => prevRange.concat(newRange), []);
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
      if (!sizes.some(item => item.width == size.width && item.height == size.height))
        sizes.push(size);
  }

  put(form: string, width: number, height: number, data: Int32Array, resumeData: string) {
    void this.imageDbManager.put(
      `${width}:${height}:${form}`, 
      {data: gzipSync(new Uint8Array(data.buffer), { level: 1 }), resumeData: resumeData}
    )
    .then(() => this.addCachedImageSize(form, { width: width, height: height}));
  }

  async cachedSize(form: string, width: number, height: number) {
    await this.awaitInitialized();

    const cachedSizes = this.cachedImageSizes.get(form);
    return cachedSizes?.filter(size => 
      (size.width === width && size.height <= height) || 
      (size.height === height && size.width <= width)
    )?.[0] ?? undefined;
  }

  async get(form: string, width: number, height: number) {
    const cachedSize = await this.cachedSize(form, width, height);
    return new Promise<{width: number, height: number, data: Int32Array, resumeData: string}>((resolve, reject) => {
      if (cachedSize !== undefined)
        void this.imageDbManager.get(`${cachedSize.width}:${cachedSize.height}:${form}`)
        .then(
          data => resolve({width: cachedSize.width, height: cachedSize.height, data: new Int32Array(gunzipSync(data.data).buffer), resumeData: data.resumeData}),
          (reason: Error) => reject(reason)
        );
      else
        reject(Error('Image not cached'));
    });
  }

  async clearStore() {
    await this.imageDbManager.clearStore();
  }
  
};