// GlobalDrag

class GlobalDrag {

  static dragOwner = null;
  static dragData = null;
  static startPoint = [0, 0];
  
  static {
    window.addEventListener('pointermove', GlobalDrag.onPointerMove);
  }
  
  static startDrag(owner, data, point) {
    this.dragOwner = owner;
    this.dragData = data;
    this.startPoint = point;
  }

  static onPointerMove(e) {
    if (this.dragOwner != null) {
      const rect = this.dragOwner.ctx.canvas.getBoundingClientRect;
      const canvasCorner = [rect.x, rect.y];
      const mousePoint = this.dragOwner.fromScreen(getEventScreenXY(e));
      this.dragOwner.onDrag(subtractVectors(mousePoint, canvasCorner), e);
    }
  }
  
  static onPointerUp() {
    if (this.dragOwner != null) {
      this.dragOwner.onDragEnd();
      this.dragOwner = null;
      this.dragData = null;
    }
  }

}