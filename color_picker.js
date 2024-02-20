// Color Picker

export function onColorPickerInput(e) {
  glob.Drag.colorPickerDragging = true;
  glob.PaletteEditor.setSelectedColor(e.value);
}

export function onColorPickerChange(e) {
  glob.Drag.colorPickerDragging = false;
  glob.PaletteEditor.setSelectedColor(e.value);
}
