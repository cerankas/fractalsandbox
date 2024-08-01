interface DataItem<T> {
  key: string;
  data: T;
}

export default class IndexedDBManager<T> {
  private db: IDBDatabase | null = null;

  constructor(private dbName: string, private dbVersion: number) {
    if (typeof window !== 'undefined') void this.openDatabase();
  }

  private async openDatabase() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onerror = () => reject(new Error("Failed to open IndexedDB"));
      request.onsuccess = () => { this.db = request.result; resolve(); };
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBRequest<IDBDatabase>).result;
        db.createObjectStore("data", { keyPath: "key" });
      };
    });
  }

  private async ensureDB() {
    if (!this.db) await this.openDatabase();
  }

  private getObjectStore(access: IDBTransactionMode) {
    const transaction = this.db!.transaction(["data"], access);
    const objectStore = transaction.objectStore("data");
    return objectStore;
  }

  async store(key: string, data: T) {
    await this.ensureDB();
    return new Promise<void>((resolve, reject) => {
      const objectStore = this.getObjectStore("readwrite");
      const request = objectStore.put({ key, data });
      request.onerror = () => reject(new Error("Failed to store data in IndexedDB"));
      request.onsuccess = () => resolve();
    });
  }
  
  async fetch(key: string) {
    await this.ensureDB();
    return new Promise<T>((resolve, reject) => {
      const objectStore = this.getObjectStore("readonly");
      const request = objectStore.get(key);
      request.onerror = () => reject(new Error("Failed to fetch data from IndexedDB"));
      request.onsuccess = () => {
        const result = request.result as DataItem<T>;
        if (result) resolve(result.data);
        else reject(new Error("No data found for the given key"));
      };
    });
  }
  
  async getAllKeys() {
    await this.ensureDB();
    return new Promise<string[]>((resolve, reject) => {
      const objectStore = this.getObjectStore("readonly");
      const request = objectStore.getAllKeys();
      request.onerror = () => reject(new Error("Failed to get all keys from IndexedDB"));
      request.onsuccess = () => {
        const result = request.result as string[];
        if (result) resolve(result);
        else reject(new Error("No data found for the given key"));
      };
    });
  }
  
  async delete(key: string) {
    await this.ensureDB();
    return new Promise<void>((resolve, reject) => {
      const objectStore = this.getObjectStore("readwrite");
      const request = objectStore.delete(key)
      request.onerror = () => reject(new Error("Failed to delete record in IndexedDB"));
      request.onsuccess = () => resolve();
    });
  }

}