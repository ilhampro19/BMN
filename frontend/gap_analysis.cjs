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
const rows = data.slice(1).filter(r => r.some(c => c !== ''));

console.log('=== 78 KOLOM MASTER BMN EXCEL vs SISTEM WEB ===\n');

// mapping kolom excel ke field sistem
const MAPPING = {
  'No':                          { field: '(No urut)',          status: 'SKIP', note: 'tidak perlu disimpan' },
  'Jenis BMN':                   { field: 'jenis_bmn / kategori', status: 'MAP', note: 'dipakai untuk auto-klasifikasi sifat & kategori' },
  'Kode Satker':                 { field: '-',                  status: 'SKIP', note: 'satker selalu sama (Itjen Kemendagri)' },
  'Nama Satker':                 { field: '-',                  status: 'SKIP', note: 'satker selalu sama' },
  'Kode Barang':                 { field: 'kode_bmn',           status: 'SIMPAN', note: 'kode akun BMN/SAKTI' },
  'NUP':                         { field: 'nup',                status: 'SIMPAN', note: 'nomor urut pendaftaran' },
  'Nama Barang':                 { field: 'itemName',           status: 'SIMPAN', note: 'nama barang' },
  'Status BMN':                  { field: '-',                  status: 'SKIP', note: 'semua "Aktif", tidak perlu disimpan' },
  'Merk':                        { field: 'merk_tipe (gabung)', status: 'SIMPAN', note: 'digabung dengan Tipe → merk_tipe' },
  'Tipe':                        { field: 'merk_tipe (gabung)', status: 'SIMPAN', note: 'digabung dengan Merk → merk_tipe' },
  'Kondisi':                     { field: 'kondisi',            status: 'SIMPAN', note: 'Baik/Rusak Berat → baik/perhatian' },
  'Umur Aset':                   { field: '-',                  status: 'BELUM', note: 'umur aset dalam tahun, belum ada kolom' },
  'Intra / Extra':               { field: '-',                  status: 'SKIP', note: 'hampir selalu Intra, tidak relevan' },
  'Henti Guna':                  { field: '-',                  status: 'SKIP', note: 'semua "Tidak"' },
  'Status SBSN':                 { field: '-',                  status: 'SKIP', note: 'semua kosong' },
  'Status BMN Idle':             { field: '-',                  status: 'SKIP', note: 'semua kosong' },
  'Status Kemitraan':            { field: '-',                  status: 'SKIP', note: 'semua "Tidak"' },
  'BPYBDS':                      { field: '-',                  status: 'SKIP', note: 'semua "Tidak"' },
  'Usulan Barang Hilang':        { field: '-',                  status: 'SKIP', note: 'semua "Tidak"' },
  'Usulan Barang RB':            { field: '-',                  status: 'SKIP', note: 'semua "Tidak"' },
  'Usul Hapus':                  { field: '-',                  status: 'SKIP', note: 'semua "Tidak"' },
  'Hibah DKTP':                  { field: '-',                  status: 'SKIP', note: 'semua "Tidak"' },
  'Konsensi Jasa':               { field: '-',                  status: 'SKIP', note: 'semua "Tidak"' },
  'Properti Investasi':          { field: '-',                  status: 'SKIP', note: 'semua "Tidak"' },
  'Jenis Dokumen':               { field: '-',                  status: 'BELUM', note: 'ada isi untuk kendaraan & tanah: BPKB, sertifikat' },
  'No Dokumen':                  { field: '-',                  status: 'BELUM', note: 'nomor BPKB / sertifikat tanah' },
  'No BPKP':                     { field: '-',                  status: 'SKIP', note: 'semua kosong' },
  'No Polisi':                   { field: 'nomor_polisi',       status: 'SIMPAN', note: 'plat nomor kendaraan' },
  'Status Sertifikasi':          { field: '-',                  status: 'SKIP', note: 'khusus tanah' },
  'Jenis Sertipikat':            { field: '-',                  status: 'SKIP', note: 'khusus tanah' },
  'No Sertifikat':               { field: '-',                  status: 'SKIP', note: 'khusus tanah' },
  'Nama':                        { field: '-',                  status: 'SKIP', note: 'nama sertifikat/dokumen tanah' },
  'Tanggal Buku Pertama':        { field: '-',                  status: 'SKIP', note: 'tanggal buku pertama (tidak perlu)' },
  'Tanggal Perolehan':           { field: 'tahunPerolehan',     status: 'SIMPAN', note: 'diambil tahunnya saja' },
  'Tanggal Pengapusan':          { field: '-',                  status: 'SKIP', note: 'semua sama (tanggal cetak laporan)' },
  'Nilai Perolehan Pertama':     { field: '-',                  status: 'SKIP', note: 'sama dengan Nilai Perolehan untuk sebagian besar' },
  'Nilai Mutasi':                { field: '-',                  status: 'BELUM', note: 'nilai mutasi (tambah/kurang)' },
  'Nilai Perolehan':             { field: 'nilaiPerolehan',     status: 'SIMPAN', note: 'nilai perolehan (Rp)' },
  'Nilai Penyusutan':            { field: '-',                  status: 'BELUM', note: 'akumulasi penyusutan dari SIMAN' },
  'Nilai Buku':                  { field: 'nilai_buku',         status: 'SIMPAN', note: 'nilai buku setelah penyusutan' },
  'Luas Tanah Seluruhnya':       { field: '-',                  status: 'SKIP', note: 'khusus tanah/bangunan (m²)' },
  'Luas Tanah Untuk Bangunan':   { field: '-',                  status: 'SKIP', note: 'khusus tanah' },
  'Luas Tanah Untuk Sarana Lingkungan': { field: '-', status: 'SKIP', note: 'khusus tanah' },
  'Luas Lahan Kosong':           { field: '-',                  status: 'SKIP', note: 'khusus tanah' },
  'Luas Bangunan':               { field: '-',                  status: 'SKIP', note: 'khusus bangunan (m²)' },
  'Luas Tapak Bangunan':         { field: '-',                  status: 'SKIP', note: 'khusus bangunan' },
  'Luas Pemanfataan':            { field: '-',                  status: 'SKIP', note: 'khusus bangunan' },
  'Jumlah Lantai':               { field: '-',                  status: 'SKIP', note: 'khusus bangunan' },
  'Jumlah Foto':                 { field: '-',                  status: 'SKIP', note: 'metadata sistem SIMAN' },
  'Status Penggunaan':           { field: 'status_penggunaan',  status: 'MAP', note: 'dipetakan ke status internal' },
  'No PSP':                      { field: '-',                  status: 'SKIP', note: 'nomor surat penetapan status penggunaan' },
  'Tanggal PSP':                 { field: '-',                  status: 'SKIP', note: 'tanggal PSP' },
  'Alamat':                      { field: '-',                  status: 'SKIP', note: 'alamat (semua sama: Jl. Medan Merdeka Timur No. 8)' },
  'RT/RW':                       { field: '-',                  status: 'SKIP', note: 'bagian alamat' },
  'Kelurahan/Desa':              { field: '-',                  status: 'SKIP', note: 'bagian alamat' },
  'Kecamatan':                   { field: '-',                  status: 'SKIP', note: 'bagian alamat' },
  'Kab/Kota':                    { field: '-',                  status: 'SKIP', note: 'bagian alamat' },
  'Kode Kab/Kota':               { field: '-',                  status: 'SKIP', note: 'kode wilayah' },
  'Provinsi':                    { field: '-',                  status: 'SKIP', note: 'bagian alamat' },
  'Kode Provinsi':               { field: '-',                  status: 'SKIP', note: 'kode wilayah' },
  'Kode Pos':                    { field: '-',                  status: 'SKIP', note: 'bagian alamat' },
  'SBSK':                        { field: '-',                  status: 'SKIP', note: 'semua "0"' },
  'Optimalisasi':                { field: '-',                  status: 'SKIP', note: 'semua "0"' },
  'Penghuni':                    { field: 'penanggung_jawab',   status: 'MAP', note: 'sama isinya dengan Pengguna/Nama Pengguna' },
  'Pengguna':                    { field: 'penanggung_jawab',   status: 'MAP', note: 'sama isinya dengan Penghuni/Nama Pengguna' },
  'Kode KPKNL':                  { field: '-',                  status: 'SKIP', note: 'kode kantor KPKNL (07104)' },
  'Uraian KPKNL':                { field: '-',                  status: 'SKIP', note: 'KPKNL JAKARTA IV' },
  'Uraian Kanwil DJKN':          { field: '-',                  status: 'SKIP', note: 'Kanwil DJKN DKI Jakarta' },
  'Nama K/L':                    { field: '-',                  status: 'SKIP', note: 'selalu Kementerian Dalam Negeri' },
  'Nama E1':                     { field: 'unit_kerja (ref)',   status: 'MAP', note: 'Inspektorat Jenderal → unit_kerja' },
  'Nama Korwil':                 { field: '-',                  status: 'SKIP', note: 'sama dengan Nama E1' },
  'Kode Register':               { field: '-',                  status: 'BELUM', note: 'ID unik SIMAN (MD5 hash), berguna sebagai external ID' },
  'Lokasi Ruang':                { field: 'lokasi_ruangan',     status: 'SIMPAN', note: 'kode ruangan resmi (L01.xx.xx)' },
  'Jenis Identitas':             { field: '-',                  status: 'SKIP', note: 'kosong untuk hampir semua' },
  'No Identitas':                { field: '-',                  status: 'BELUM', note: 'nomor rangka/NID kendaraan' },
  'No STNK':                     { field: 'nomor_seri',         status: 'SIMPAN', note: 'No STNK kendaraan' },
  'Nama Pengguna':               { field: 'penanggung_jawab',   status: 'SIMPAN', note: 'nama pegawai pemegang aset' },
  'Status PMK':                  { field: '-',                  status: 'SKIP', note: 'semua kosong' },
};

// Print summary
const simpan = Object.entries(MAPPING).filter(([,v]) => v.status === 'SIMPAN');
const map = Object.entries(MAPPING).filter(([,v]) => v.status === 'MAP');
const belum = Object.entries(MAPPING).filter(([,v]) => v.status === 'BELUM');
const skip = Object.entries(MAPPING).filter(([,v]) => v.status === 'SKIP');

console.log(`✅ DISIMPAN langsung (${simpan.length} kolom):`);
simpan.forEach(([col, v]) => console.log(`   ${col.padEnd(35)} → ${v.field}`));

console.log(`\n🔄 DIPETAKAN/DIKONVERSI (${map.length} kolom):`);
map.forEach(([col, v]) => console.log(`   ${col.padEnd(35)} → ${v.note}`));

console.log(`\n⚠️  BELUM DISIMPAN - bisa ditambahkan (${belum.length} kolom):`);
belum.forEach(([col, v]) => console.log(`   ${col.padEnd(35)} → ${v.note}`));

console.log(`\n⏭️  DILEWATI/SKIP (${skip.length} kolom):`);
skip.forEach(([col, v]) => console.log(`   ${col.padEnd(35)} → ${v.note}`));

// Check actual data for "BELUM" columns
console.log('\n=== CEK ISI KOLOM "BELUM DISIMPAN" ===');
const belumCols = ['Jenis Dokumen', 'No Dokumen', 'Nilai Mutasi', 'Nilai Penyusutan', 'Kode Register', 'No Identitas', 'Umur Aset'];
belumCols.forEach(col => {
  const idx = headers.indexOf(col);
  if (idx < 0) { console.log(`\n[${col}]: kolom tidak ditemukan`); return; }
  const vals = {};
  rows.forEach(r => {
    const v = String(r[idx] ?? '').trim();
    if (v && v !== '0' && v !== '-') vals[v] = (vals[v]||0)+1;
  });
  const sorted = Object.entries(vals).sort((a,b)=>b[1]-a[1]);
  console.log(`\n[${col}] - ${sorted.length} nilai unik (ada isi):`);
  sorted.slice(0,8).forEach(([k,c]) => console.log(`   "${k}": ${c}x`));
});
