export default class IndexedDBManager<T> {
  private db: IDBDatabase | null = null;
  private initialQueue: (() => void)[] = [];

  constructor(private dbName: string, private dbVersion: number) {
    if (typeof window === 'undefined') return;
    
    void new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onerror = () => reject(Error('Failed to open IndexedDB'));
      request.onsuccess = () => { this.db = request.result; resolve(); };
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBRequest<IDBDatabase>).result;
        if (event.oldVersion != 0) db.deleteObjectStore("data");
        db.createObjectStore("data", { keyPath: "key" });
      };
    })
    .then(() => this.initialQueue.forEach(callback => callback()));
  }

  private awaitDBOpened = async () => new Promise<void>(resolve =>
    this.db ? resolve() : this.initialQueue.push(() => resolve())
  );

  private async getObjectStore(access: IDBTransactionMode) {
    return this.awaitDBOpened()
    .then(
      () => {
        const transaction = this.db!.transaction(["data"], access);
        const objectStore = transaction.objectStore("data");
        return objectStore;
      }
    );
  }

  async put(key: string, data: T) {
    const objectStore = await this.getObjectStore("readwrite");
    return new Promise<void>((resolve, reject) => {
      const request = objectStore.put({ key, data });
      request.onerror = () => reject(Error('Failed to put data in IndexedDB'));
      request.onsuccess = () => resolve();
    });
  }
  
  async get(key: string) {
    const objectStore = await this.getObjectStore("readonly");
    return new Promise<T>((resolve, reject) => {
      const request = objectStore.get(key);
      request.onerror = () => reject(Error('Failed to get data from IndexedDB'));
      request.onsuccess = () => {
        const result = request.result as {data: T};
        if (result) resolve(result.data);
        else reject(Error('Got no data from IndexedDB'));
      }
    });
  }
  
  async getAllKeys() {
    const objectStore = await this.getObjectStore("readonly");
    return new Promise<string[]>((resolve, reject) => {
      const request = objectStore.getAllKeys();
      request.onerror = () => reject(Error('Failed to get all keys from IndexedDB'));
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }
  
  async getUsage() {
    const objectStore = await this.getObjectStore("readonly");
    return new Promise<{size:number, cnt:number}>((resolve, reject) => {
      const request = objectStore.openCursor();
      let size = 0;
      let cnt = 0;
      request.onerror = () => reject(Error('Failed to get all keys from IndexedDB'));
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const data = cursor.value.data;
          if (data?.size) size += data.size;
          if (data?.data?.length) size += data.data.length;
          if (data?.ley?.length) size += data.key.length;
          size += cursor.value.key.length;
          cnt += 1;
          cursor.continue();
        } else {
          console.log('count size', this.dbName, cnt, size)
          resolve({size, cnt});
        }
      }
    });
  }
  
  async delete(key: string) {
    const objectStore = await this.getObjectStore("readwrite");
    return new Promise<void>((resolve, reject) => {
      const request = objectStore.delete(key);
      request.onerror = () => reject(Error('Failed to delete data in IndexedDB'));
      request.onsuccess = () => resolve();
    });
  }
  
  async clearStore() {
    const objectStore = await this.getObjectStore("readwrite");
    return new Promise<void>((resolve, reject) => {
      const request = objectStore.clear();
      request.onerror = () => reject(Error('Failed to clear store in IndexedDB'));
      request.onsuccess = () => resolve();
    });    
  }

}