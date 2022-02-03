// Utils

function getMilliseconds() { return Number(new Date()); }

/*function memoryTest() {
  let memoryTestStepSize = 100 * 1000 * 1000;
  const t = [];
  while (true) 
    try {
      t.push(new Int8Array(memoryTestStepSize));
    } catch (error) {
      alert('failure after allocating ' + memoryTestStepSize * t.length +  ' bytes');
      return;
    }
}*/
