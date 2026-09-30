const xlsx = require('xlsx');

const wb = xlsx.readFile('D:/TUGAS/BMN/Daftar Aset Barang BMN.xlsx');
const ws = wb.Sheets['Master Aset'];

const cellKeys = Object.keys(ws).filter(k => !k.startsWith('!'));
let maxR = 0, maxC = 0;
cellKeys.forEach(k => {
  const dec = xlsx.utils.decode_cell(k);
  if (dec.r > maxR) maxR = dec.r;
  if (dec.c > maxC) maxC = dec.c;
});
ws['!ref'] = xlsx.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxR, c: maxC } });

const data = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });
const headers = data[0];
console.log('=== TOTAL COLUMNS: ' + headers.length + ' ===');
headers.forEach((h, idx) => {
  console.log(`${idx}: ${h}`);
});

const rows = data.slice(1).filter(r => r[0] !== '' || r[4] !== '');
console.log('\nTotal Data Rows: ' + rows.length);

function summarizeCol(colName) {
  const idx = headers.indexOf(colName);
  if (idx === -1) {
    console.log('Column not found: ' + colName);
    return;
  }
  const counts = {};
  rows.forEach(r => {
    const val = (r[idx] !== undefined && r[idx] !== null) ? String(r[idx]).trim() : '';
    counts[val] = (counts[val] || 0) + 1;
  });
  console.log(`\n--- Summary for [${colName}] (idx ${idx}) ---`);
  const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
  sorted.slice(0, 15).forEach(([k, v]) => {
    console.log(`  "${k}": ${v}`);
  });
  if (sorted.length > 15) {
    console.log(`  ... total unique values: ${sorted.length}`);
  }
}

summarizeCol('Jenis BMN');
summarizeCol('Status BMN');
summarizeCol('Kondisi');
summarizeCol('Lokasi Ruang');
summarizeCol('Nama Pengguna');
summarizeCol('Pengguna');
summarizeCol('Penghuni');
summarizeCol('Status Penggunaan');
summarizeCol('Jenis Dokumen');
summarizeCol('Intra / Extra');

// Sample check for some rows
console.log('\n--- Sample 3 Items with detail ---');
rows.slice(0, 3).forEach((r, i) => {
  console.log(`\nItem ${i+1}:`);
  console.log(`  Jenis BMN: ${r[headers.indexOf('Jenis BMN')]}`);
  console.log(`  Kode Barang: ${r[headers.indexOf('Kode Barang')]}`);
  console.log(`  NUP: ${r[headers.indexOf('NUP')]}`);
  console.log(`  Nama Barang: ${r[headers.indexOf('Nama Barang')]}`);
  console.log(`  Merk: ${r[headers.indexOf('Merk')]}`);
  console.log(`  Tipe: ${r[headers.indexOf('Tipe')]}`);
  console.log(`  Kondisi: ${r[headers.indexOf('Kondisi')]}`);
  console.log(`  Tgl Perolehan: ${r[headers.indexOf('Tanggal Perolehan')]}`);
  console.log(`  Nilai Perolehan: ${r[headers.indexOf('Nilai Perolehan')]}`);
  console.log(`  Nilai Buku: ${r[headers.indexOf('Nilai Buku')]}`);
  console.log(`  Lokasi Ruang: ${r[headers.indexOf('Lokasi Ruang')]}`);
  console.log(`  Nama Pengguna: ${r[headers.indexOf('Nama Pengguna')]}`);
});
