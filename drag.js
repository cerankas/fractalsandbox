// Drag

import * as util from './util.js'
import Vec from './vector.js'

export default class Drag {

    constructor() {
    this.dragOwner = null;
    this.colorPickerDragging = false;
    window.addEventListener('pointermove', this.onPointerMove.bind(this));
    window.addEventListener('pointerup',   this.onPointerUp.bind(this));
  }
  
  startDrag(owner) {
    this.dragOwner = owner;
  }

  isDragging() {
    return this.dragOwner != null || this.colorPickerDragging;
  }

  onPointerMove(e) {
    if (this.dragOwner) {
      const rect = this.dragOwner.ctx.canvas.getBoundingClientRect();
      const canvasCorner = [rect.left, rect.top];
      const mousePoint = util.getEventPageXY(e);
      this.dragOwner.onDrag(Vec.from(mousePoint).sub(canvasCorner));
    }
  }
  
  onPointerUp() {
    if (this.dragOwner) {
      if (this.dragOwner.onDragEnd) this.dragOwner.onDragEnd();
      this.dragOwner = null;
    }
  }

}