const xlsx = require('xlsx');

const wb = xlsx.readFile('D:/TUGAS/BMN/Daftar Aset Barang BMN.xlsx');
const ws = wb.Sheets['Master Aset'];

// Fix range
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
const rows = data.slice(1);

const jIdx = headers.map(h => String(h).toLowerCase()).indexOf('jenis bmn');
const kIdx = headers.map(h => String(h).toLowerCase()).indexOf('kode barang');
const nIdx = headers.map(h => String(h).toLowerCase()).indexOf('nup');
const namaIdx = headers.map(h => String(h).toLowerCase()).indexOf('nama barang');
const merkIdx = headers.map(h => String(h).toLowerCase()).indexOf('merk');
const tipeIdx = headers.map(h => String(h).toLowerCase()).indexOf('tipe');
const kondisiIdx = headers.map(h => String(h).toLowerCase()).indexOf('kondisi');
const lokasiIdx = headers.map(h => String(h).toLowerCase()).indexOf('lokasi ruang');
const nilaiPerolehanIdx = headers.map(h => String(h).toLowerCase()).indexOf('nilai perolehan');
const nilaiBukuIdx = headers.map(h => String(h).toLowerCase()).indexOf('nilai buku');
const tglPerolehanIdx = headers.map(h => String(h).toLowerCase()).indexOf('tanggal perolehan');
const noPolisiIdx = headers.map(h => String(h).toLowerCase()).indexOf('no polisi');
const namaUserIdx = headers.map(h => String(h).toLowerCase()).indexOf('nama pengguna');

// Simulate what ImportExcelModal would produce
function excelDateToYear(serial) {
  if (!serial) return null;
  if (typeof serial === 'string') {
    const y = parseInt(serial);
    return y > 1900 && y < 2100 ? y : null;
  }
  if (typeof serial === 'number' && serial > 1000) {
    const d = new Date((serial - 25569) * 86400 * 1000);
    return d.getUTCFullYear();
  }
  return null;
}

const JENIS_BMN_SIFAT = {
  'TANAH': 'terikat_ruangan',
  'ALAT BESAR': 'terikat_ruangan',
  'ALAT ANGKUTAN BERMOTOR': 'bergerak',
  'MESIN PERALATAN NON TIK': 'terikat_ruangan',
  'MESIN PERALATAN KHUSUS TIK': 'bergerak',
  'BANGUNAN DAN GEDUNG': 'terikat_ruangan',
  'ASET TAK BERWUJUD': 'terikat_ruangan',
};

const JENIS_BMN_KAT = {
  'TANAH': 'KAT-TNH',
  'ALAT BESAR': 'KAT-ABR',
  'ALAT ANGKUTAN BERMOTOR': 'KAT-KND',
  'MESIN PERALATAN NON TIK': 'KAT-MBL',
  'MESIN PERALATAN KHUSUS TIK': 'KAT-TIK',
  'BANGUNAN DAN GEDUNG': 'KAT-BGN',
  'ASET TAK BERWUJUD': 'KAT-ATB',
};

// Stats
const stats = {};
const perKategoriNilai = {};
let totalImportable = 0;
let totalSkipped = 0;
const skippedReasons = {};
const samples = [];

rows.forEach((row, i) => {
  const jenisBmn = String(row[jIdx] ?? '').toUpperCase().trim();
  const kodeBarang = String(row[kIdx] ?? '').trim();
  const nup = String(row[nIdx] ?? '').trim();
  const namaBarang = String(row[namaIdx] ?? '').trim();

  if (!namaBarang || !kodeBarang) {
    const reason = !namaBarang ? 'Nama Barang kosong' : 'Kode Barang kosong';
    skippedReasons[reason] = (skippedReasons[reason] || 0) + 1;
    totalSkipped++;
    return;
  }

  // Would be importable
  totalImportable++;

  // Stats per Jenis BMN
  stats[jenisBmn] = (stats[jenisBmn] || 0) + 1;

  const nilaiPerolehan = parseFloat(String(row[nilaiPerolehanIdx] ?? '0').replace(/[^0-9.]/g, '')) || 0;
  perKategoriNilai[jenisBmn] = (perKategoriNilai[jenisBmn] || 0) + nilaiPerolehan;

  // Sample first 5
  if (samples.length < 5) {
    samples.push({
      no: i + 1,
      jenisBmn,
      kodeBarang,
      nup,
      namaBarang,
      merk: String(row[merkIdx] ?? '').trim(),
      tipe: String(row[tipeIdx] ?? '').trim(),
      kondisi: String(row[kondisiIdx] ?? '').trim(),
      lokasi: String(row[lokasiIdx] ?? '').trim(),
      tahun: excelDateToYear(row[tglPerolehanIdx]),
      nilaiPerolehan,
      nilaiBuku: parseFloat(String(row[nilaiBukuIdx] ?? '0').replace(/[^0-9.]/g, '')) || 0,
      noPolisi: String(row[noPolisiIdx] ?? '').trim(),
      namaPengguna: String(row[namaUserIdx] ?? '').trim(),
      sifatAset: JENIS_BMN_SIFAT[jenisBmn] || 'terikat_ruangan',
      kategoriKode: JENIS_BMN_KAT[jenisBmn] || 'KAT-MBL',
      itemCode: `SIMAN-${kodeBarang.replace(/\./g, '')}-${String(nup).padStart(4, '0')}`,
    });
  }
});

console.log('=== SIMULASI IMPORT MASTER BMN ===');
console.log(`Total baris: ${rows.length}`);
console.log(`Total BISA DIIMPOR: ${totalImportable}`);
console.log(`Total dilewati: ${totalSkipped}`);
if (Object.keys(skippedReasons).length) {
  console.log('Alasan dilewati:', JSON.stringify(skippedReasons, null, 2));
}

console.log('\n=== RINCIAN PER JENIS BMN ===');
const sorted = Object.entries(stats).sort((a,b) => b[1]-a[1]);
let totalNilai = 0;
sorted.forEach(([j, c]) => {
  const nilai = perKategoriNilai[j] || 0;
  totalNilai += nilai;
  const formatted = (nilai / 1e9).toFixed(2);
  console.log(`  ${j}: ${c} aset | Nilai Perolehan: Rp ${formatted} M`);
});
console.log(`\n  TOTAL NILAI PEROLEHAN: Rp ${(totalNilai/1e9).toFixed(2)} Miliar`);

console.log('\n=== SAMPEL 5 ITEM PERTAMA ===');
samples.forEach((s, i) => {
  console.log(`\nItem ${i+1}:`);
  console.log(`  itemCode  : ${s.itemCode}`);
  console.log(`  Jenis BMN : ${s.jenisBmn}`);
  console.log(`  Kategori  : ${s.kategoriKode} | Sifat: ${s.sifatAset}`);
  console.log(`  Nama      : ${s.namaBarang}`);
  console.log(`  Merk/Tipe : ${[s.merk, s.tipe].filter(Boolean).join(' ') || '-'}`);
  console.log(`  Kondisi   : ${s.kondisi}`);
  console.log(`  Tahun     : ${s.tahun}`);
  console.log(`  Nilai     : Rp ${s.nilaiPerolehan.toLocaleString('id-ID')} | Buku: Rp ${s.nilaiBuku.toLocaleString('id-ID')}`);
  console.log(`  Lokasi    : ${s.lokasi || 'Belum berlokasi'}`);
  console.log(`  No Polisi : ${s.noPolisi || '-'}`);
  console.log(`  Pengguna  : ${s.namaPengguna || '-'}`);
});
