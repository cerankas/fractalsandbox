// History

export default class History {

  constructor(onRestoreItem) {
    this.stack = [];
    this.pointer = -1;
    this.restoreItem = onRestoreItem;
  }

  store(item) {
    if (this.stack.length) {
      let different = false;
      for (let field in item) if (item[field] != this.stack[this.pointer][field]) different = true;
      if (!different) return;
    }
    if (this.isPointerBeforeLastItem()) this.deleteItemsAfterPointer();
    this.stack.push(item);
    this.pointer ++;
  }
  
  back()    { if (this.isPointerAfterFirstItem()) this.restoreItem(this.stack[--this.pointer]); }
  
  forward() { if (this.isPointerBeforeLastItem()) this.restoreItem(this.stack[++this.pointer]); }

  isPointerAfterFirstItem() { return this.pointer > 0; }

  isPointerBeforeLastItem() { return this.pointer < this.stack.length - 1; }

  deleteItemsAfterPointer() { this.stack.splice(this.pointer + 1); }

}
