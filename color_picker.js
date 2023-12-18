// Color Picker

function onColorPickerInput(e) {
  glob.Drag.colorPickerDragging = true;
  glob.PaletteEditor.setSelectedColor(e.value);
}

function onColorPickerChange(e) {
  glob.Drag.colorPickerDragging = false;
  glob.PaletteEditor.setSelectedColor(e.value);
}
