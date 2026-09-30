const xlsx = require('xlsx');

const wb = xlsx.readFile('D:/TUGAS/BMN/Daftar Aset Barang BMN.xlsx');
console.log('Sheet Names:', wb.SheetNames);

wb.SheetNames.forEach(sheetName => {
  const ws = wb.Sheets[sheetName];
  const cellKeys = Object.keys(ws).filter(k => !k.startsWith('!'));
  let maxR = 0, maxC = 0;
  cellKeys.forEach(k => {
    const dec = xlsx.utils.decode_cell(k);
    if (dec.r > maxR) maxR = dec.r;
    if (dec.c > maxC) maxC = dec.c;
  });
  console.log(`Sheet "${sheetName}": Max Row = ${maxR + 1}, Max Col = ${maxC + 1} (${xlsx.utils.encode_col(maxC)})`);

  console.log('\n--- DAFTAR SEMUA KOLOM ---');
  for (let c = 0; c <= maxC; c++) {
    const colLetter = xlsx.utils.encode_col(c);
    const r1 = ws[colLetter + '1']?.v ?? '';
    const r2 = ws[colLetter + '2']?.v ?? '';
    console.log(`${c + 1} (Col ${colLetter}): "${r1}" ${r2 ? `[R2: ${r2}]` : ''}`);
  }
});
