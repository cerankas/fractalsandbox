export type HistoryItem = {
  form: string
  color: string
}

export default class FractalHistory {
  stack: HistoryItem[] = [];
  pointer = -1;

  constructor(public restoreItem: (item: HistoryItem) => void) {}

  store(item: HistoryItem) {
    if (this.stack.length && this.currentItem()?.form === item.form && this.currentItem()?.color === item.color) return;
    if (this.hasItemsAfterPointer()) this.deleteItemsAfterPointer();
    this.stack.push(item);
    this.pointer ++;
  }
  
  back() { if (this.hasItemsBeforePointer()) this.restoreItem(this.stack[--this.pointer]!); }
  
  forward() { if (this.hasItemsAfterPointer()) this.restoreItem(this.stack[++this.pointer]!); }

  currentItem() { return this.stack[this.pointer]; }

  hasItemsBeforePointer() { return this.pointer > 0; }

  hasItemsAfterPointer() { return this.pointer < this.stack.length - 1; }

  deleteItemsAfterPointer() { this.stack.splice(this.pointer + 1); }

}
