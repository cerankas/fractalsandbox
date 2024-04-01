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

  async check(key: string): Promise<boolean> {
      if (!this.db) {
          await this.openDatabase();
      }

      return new Promise<boolean>((resolve, reject) => {
          const transaction = this.db!.transaction(["data"], "readonly");
          const objectStore = transaction.objectStore("data");
          const request = objectStore.get(key);

          request.onerror = () => {
              reject(new Error("Failed to check data in IndexedDB"));
          };

          request.onsuccess = () => {
              resolve(!!(request.result as DataItem));
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

// Example usage:
export async function test() {
  const indexedDBManager = new IndexedDBManager("myDB", 1);
  await indexedDBManager.openDatabase();

  const key = "exampleKey 4";
  const data = new Int32Array([1, 2, 3, 4]);

  await indexedDBManager.store(key, data);

  const isStored = await indexedDBManager.check(key);
  console.log("Is data stored:", isStored);

  const fetchedData = await indexedDBManager.fetch(key);
  console.log("Fetched data:", fetchedData);

  return 0;
};
