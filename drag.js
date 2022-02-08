// GlobalDrag

class GlobalDrag {

  static dragOwner = null;
  
  static {
    window.addEventListener('pointermove', this.onPointerMove.bind(this));
    window.addEventListener('pointerup',   this.onPointerUp.bind(this));
  }
  
  static startDrag(owner) {
    this.dragOwner = owner;
  }

  static onPointerMove(e) {
    if (this.dragOwner) {
      const rect = this.dragOwner.ctx.canvas.getBoundingClientRect();
      const canvasCorner = [rect.left, rect.top];
      const mousePoint = getEventScreenXY(e);
      this.dragOwner.onDrag(mousePoint.sub(canvasCorner));
    }
  }
  
  static onPointerUp() {
    if (this.dragOwner) {
      this.dragOwner.onDragEnd();
      this.dragOwner = null;
    }
  }

}