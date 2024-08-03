export default class IndexedDBManager<T> {
  private db: IDBDatabase | null = null;
  private initialQueue: (() => void)[] = [];

  constructor(private dbName: string, private dbVersion: number) {
    if (typeof window === 'undefined') return;
    
    void new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onerror = () => reject();
      request.onsuccess = () => { this.db = request.result; resolve(); };
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBRequest<IDBDatabase>).result;
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
      request.onerror = () => reject();
      request.onsuccess = () => resolve();
    });
  }
  
  async get(key: string) {
    const objectStore = await this.getObjectStore("readonly");
    return new Promise<T>((resolve, reject) => {
      const request = objectStore.get(key);
      request.onerror = () => reject();
      request.onsuccess = () => {
        const result = request.result as {data: T};
        if (result) resolve(result.data);
        else reject();
      }
    });
  }
  
  async getAllKeys() {
    const objectStore = await this.getObjectStore("readonly");
    return new Promise<string[]>((resolve, reject) => {
      const request = objectStore.getAllKeys();
      request.onerror = () => reject();
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }
  
  async delete(key: string) {
    const objectStore = await this.getObjectStore("readwrite");
    return new Promise<void>((resolve, reject) => {
      const request = objectStore.delete(key)
      request.onerror = () => reject();
      request.onsuccess = () => resolve();
    });
  }

}