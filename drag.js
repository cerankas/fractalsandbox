// GlobalDrag

class GlobalDrag {
  static dragObject = null;
  static dragStart = [0, 0];
  static {
    window.addEventListener('pointermove', GlobalDrag.onPointerMove);
  }
  static onPointerMove(e) {
    if (this.dragObject != null) {
      const rect = this.dragObject.ctx.canvas.getBoundingClientRect;
      this.dragObject.onDrag([e.screenX - rect.x, e.screenY - rect.y]);
    }
  }
  static onPointerUp() {
    if (this.dragObject != null) {
      this.dragObject.onDragEnd();
      this.dragObject = null;
    }
  }
}