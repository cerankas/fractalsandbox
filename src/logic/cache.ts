interface DataItem<T> {
  key: string;
  data: T;
}

export default class IndexedDBManager<T> {
  private db: IDBDatabase | null = null;

  constructor(private dbName: string, private dbVersion: number) {
    if (typeof window !== 'undefined') void this.openDatabase();
  }

  private async openDatabase(): Promise<void> {
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

  async store(key: string, data: T): Promise<void> {
    if (!this.db) await this.openDatabase();
    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(["data"], "readwrite");
      const objectStore = transaction.objectStore("data");
      const request = objectStore.put({ key, data });
      request.onerror = () => reject(new Error("Failed to store data in IndexedDB"));
      request.onsuccess = () => resolve();
    });
  }

  async fetch(key: string): Promise<T> {
    if (!this.db) await this.openDatabase();
    return new Promise<T>((resolve, reject) => {
      const transaction = this.db!.transaction(["data"], "readonly");
      const objectStore = transaction.objectStore("data");
      const request = objectStore.get(key);
      request.onerror = () => reject(new Error("Failed to fetch data from IndexedDB"));
      request.onsuccess = () => {
        const result = request.result as DataItem<T>;
        if (result) resolve(result.data);
        else reject(new Error("No data found for the given key"));
      };
    });
  }
}