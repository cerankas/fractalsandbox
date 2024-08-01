import IndexedDBManager from "./cache";

export default class ImageCache {
  dbManager = new IndexedDBManager<Int32Array>('images', 1);
  keys = new Map<string, { width: number, height: number }[]>;

  constructor() {
    if (typeof window === 'undefined') return;
    void this.dbManager.getAllKeys()
    .then(keys => keys.forEach((key) => {
      const [width, height, form] = key.split(':');
      if (!width || !height || !form) throw Error("Invalid key in image cache db")
      this.addKey(form, { width: parseFloat(width), height: parseFloat(height) });
    }));
  }

  private addKey(form: string, size: { width: number, height: number }) {
    const key = this.keys.get(form);
    if (key === undefined)
      this.keys.set(form, [size]);
    else
      key.push(size);
  }

  store(form: string, width: number, height: number, data: Int32Array) {
    void this.dbManager
    .store(`${width}:${height}:${form}`, data)
    .then(() => this.addKey(form, { width: width, height: height}));
  }

  isStored(form: string, width: number, height: number) {
    const w9 = width * .9 | 0;
    const h9 = height * .9 | 0;
    return this.keys.get(form)
    ?.filter(size => (size.width === w9 && size.height <= h9) || (size.height === h9 && size.width <= w9)).length !== 0 ?? false;
  }

  async fetch(form: string, width: number, height: number) {
    return new Promise<{width: number, height: number, data: Int32Array}>((resolve, reject) => {
      const size = this.keys.get(form)
        ?.filter(size => (size.width === width && size.height <= height) || (size.height === height && size.width <= width))?.[0] ?? undefined;
      if (size !== undefined)
        void this.dbManager.fetch(`${size.width}:${size.height}:${form}`)
        .then(
          (data) => {resolve({width: size.width, height: size.height, data: data})},
          () => reject()
        );
      else
        reject();
    });
  }
  
};