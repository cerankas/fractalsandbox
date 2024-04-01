interface DataItem {
  key: string;
  data: Int32Array;
}

export default class IndexedDBManager {
  private dbName: string;
  private dbVersion: number;
  private db: IDBDatabase | null;

  constructor(dbName: string, dbVersion: number) {
      this.dbName = dbName;
      this.dbVersion = dbVersion;
      this.db = null;
  }

  async openDatabase(): Promise<void> {
      return new Promise<void>((resolve, reject) => {
          const request = indexedDB.open(this.dbName, this.dbVersion);

          request.onerror = () => {
              reject(new Error("Failed to open IndexedDB"));
          };

          request.onsuccess = () => {
              this.db = request.result;
              resolve();
          };

          request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
              const db = (event.target as IDBRequest<IDBDatabase>).result;
              db.createObjectStore("data", { keyPath: "key" });
          };
      });
  }

  async store(key: string, data: Int32Array): Promise<void> {
      if (!this.db) {
          await this.openDatabase();
      }

      return new Promise<void>((resolve, reject) => {
          const transaction = this.db!.transaction(["data"], "readwrite");
          const objectStore = transaction.objectStore("data");
          const request = objectStore.put({ key, data });

          request.onerror = () => {
              reject(new Error("Failed to store data in IndexedDB"));
          };

          request.onsuccess = () => {
              resolve();
          };
      });
  }

  async fetch(key: string): Promise<Int32Array> {
      if (!this.db) {
          await this.openDatabase();
      }

      return new Promise<Int32Array>((resolve, reject) => {
          const transaction = this.db!.transaction(["data"], "readonly");
          const objectStore = transaction.objectStore("data");
          const request = objectStore.get(key);

          request.onerror = () => {
              reject(new Error("Failed to fetch data from IndexedDB"));
          };

          request.onsuccess = () => {
              const result = request.result as DataItem;
              if (result) {
                  resolve(result.data);
              } else {
                  reject(new Error("No data found for the given key"));
              }
          };
      });
  }
}