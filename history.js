// History

class History {

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
    if (!this.isPointerAtLastItem()) this.deleteItemsAfterPointer();
    this.stack.push(item);
    this.pointer ++;
  }
  
  back()    { if (!this.isPointerAtFirstItem()) this.restoreItem(this.stack[--this.pointer]); }
  
  forward() { if (!this.isPointerAtLastItem())  this.restoreItem(this.stack[++this.pointer]); }

  isPointerAtFirstItem() { return this.pointer == 0; }

  isPointerAtLastItem()  { return this.pointer == this.stack.length - 1; }

  deleteItemsAfterPointer() { this.stack.splice(this.pointer + 1); }

}
