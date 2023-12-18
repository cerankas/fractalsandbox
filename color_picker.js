// Color Picker

function onColorPickerInput(e) {
  globalDrag.colorPickerDragging = true;
  globalPaletteEditor.setSelectedColor(e.value);
}

function onColorPickerChange(e) {
  globalDrag.colorPickerDragging = false;
  globalPaletteEditor.setSelectedColor(e.value);
}
