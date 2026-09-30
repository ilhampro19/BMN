<?php

namespace Database\Seeders;

use App\Models\Item;
use App\Models\KategoriItem;
use App\Models\MutasiLokasi;
use App\Models\Pegawai;
use App\Models\PeminjamanWasrik;
use App\Models\PengajuanServis;
use App\Models\Penyusutan;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 0. Master Data 5 Pegawai Resmi Kemendagri
        $pegawais = [
            [
                'nip' => '19661122 199303 1 001',
                'nama' => 'Dr. Ir. Bachril Bakri, M.App.Sc',
                'jabatan' => 'Sekretaris Inspektorat Jenderal',
                'unit_kerja' => 'Sekretariat Inspektorat Jenderal',
                'status' => 'aktif',
            ],
            [
                'nip' => '19900217 201206 1 002',
                'nama' => 'Andi Agung Febrianto, S.STP, M.Kessos',
                'jabatan' => 'Kepala Bagian Umum dan Keuangan',
                'unit_kerja' => 'Bagian Umum dan Keuangan',
                'status' => 'aktif',
            ],
            [
                'nip' => '19730609 199311 1 002',
                'nama' => 'Dr. Drs. Andi Muhammad Yusuf, M.Si',
                'jabatan' => 'Inspektur III',
                'unit_kerja' => 'Inspektorat Wilayah III',
                'status' => 'aktif',
            ],
            [
                'nip' => '19670815 199303 1 001',
                'nama' => 'Dr. Drs. Teguh Narutomo, M.M.',
                'jabatan' => 'Inspektur Wilayah I',
                'unit_kerja' => 'Inspektorat Wilayah I',
                'status' => 'aktif',
            ],
            [
                'nip' => '19690905 199203 1 003',
                'nama' => 'Dr. Arsan Latif, M.Si',
                'jabatan' => 'Inspektur Wilayah IV',
                'unit_kerja' => 'Inspektorat Wilayah IV',
                'status' => 'aktif',
            ],
        ];

        foreach ($pegawais as $p) {
            Pegawai::updateOrCreate(['nip' => $p['nip']], $p);
        }

        // 1. Akun 4 Role
        $users = [
            [
                'name' => 'Admin BMN Itjen',
                'email' => 'admin.bmn@kemendagri.go.id',
                'role' => 'admin',
                'unit_kerja' => 'Subbag BMN & Rumah Tangga',
                'password' => Hash::make('password123'),
            ],
            [
                'name' => 'Operator TU Irwil I',
                'email' => 'operator.irwil1@kemendagri.go.id',
                'role' => 'operator',
                'unit_kerja' => 'Inspektorat Wilayah I',
                'password' => Hash::make('password123'),
            ],
            [
                'name' => 'Budi Santoso, S.Sos',
                'email' => 'staf.budi@kemendagri.go.id',
                'role' => 'staf',
                'unit_kerja' => 'Bagian Umum & Kepegawaian',
                'password' => Hash::make('password123'),
            ],
            [
                'name' => 'Inspektur Jenderal Kemendagri',
                'email' => 'irjen@kemendagri.go.id',
                'role' => 'pimpinan',
                'unit_kerja' => 'Pimpinan Itjen',
                'password' => Hash::make('password123'),
            ],
        ];

        foreach ($users as $u) {
            User::updateOrCreate(['email' => $u['email']], $u);
        }

        // 2. Kategori BMN SAKTI / PMK Kemenkeu Standar Lengkap
        $kategori1 = KategoriItem::updateOrCreate(
            ['kategoriItemCode' => 'KAT-TIK'],
            ['kategoriItemName' => 'Peralatan Komputer & TI Pengawasan', 'umurEkonomisTahun' => 4, 'tarifPenyusutanPersen' => 25.00]
        );
        $kategori2 = KategoriItem::updateOrCreate(
            ['kategoriItemCode' => 'KAT-KND'],
            ['kategoriItemName' => 'Kendaraan Operasional Pengawasan', 'umurEkonomisTahun' => 8, 'tarifPenyusutanPersen' => 12.50]
        );
        $kategori3 = KategoriItem::updateOrCreate(
            ['kategoriItemCode' => 'KAT-MBL'],
            ['kategoriItemName' => 'Mebel & Alat Kantor', 'umurEkonomisTahun' => 5, 'tarifPenyusutanPersen' => 20.00]
        );
        $kategori4 = KategoriItem::updateOrCreate(
            ['kategoriItemCode' => 'KAT-BGN'],
            ['kategoriItemName' => 'Gedung & Bangunan Kantor Itjen', 'umurEkonomisTahun' => 20, 'tarifPenyusutanPersen' => 5.00]
        );
        $kategori5 = KategoriItem::updateOrCreate(
            ['kategoriItemCode' => 'KAT-STU'],
            ['kategoriItemName' => 'Alat Studio, Komunikasi & Audio Visual', 'umurEkonomisTahun' => 5, 'tarifPenyusutanPersen' => 20.00]
        );
        $kategori6 = KategoriItem::updateOrCreate(
            ['kategoriItemCode' => 'KAT-JRN'],
            ['kategoriItemName' => 'Alat Pemancar, Jaringan & Server Data Center', 'umurEkonomisTahun' => 10, 'tarifPenyusutanPersen' => 10.00]
        );

        // 3. BARANG BMN: 2 LAPTOP/TIK + 1 KENDARAAN DINAS
        // Barang 1 (Laptop Penyerahan)
        $item1 = Item::updateOrCreate(
            ['itemCode' => '3.10.01.02.002.45'],
            [
                'kategori_item_id' => $kategori1->id,
                'nup' => '0045',
                'kode_bmn' => '3.10.01.02.002',
                'itemName' => 'Laptop HP ENVY X360 13 Touch',
                'merk_tipe' => 'HP ENVY X360 13 AY1054AU Ryzen 7',
                'nomor_seri' => '5CD14209X8',
                'tahunPerolehan' => 2023,
                'nilaiPerolehan' => 18500000.00,
                'nilai_buku' => 13875000.00,
                'kondisi' => 'baik',
                'status_penggunaan' => 'digunakan',
                'sifat_aset' => 'bergerak',
                'lokasi_ruangan' => 'L01.03.01 - Ruang Auditor Irwil III',
                'unit_kerja' => 'Inspektorat Wilayah III',
                'penanggung_jawab' => 'Dr. Drs. Andi Muhammad Yusuf, M.Si',
            ]
        );

        // Barang 2 (Laptop Pengembalian ke Gudang)
        $item2 = Item::updateOrCreate(
            ['itemCode' => '3.10.01.02.003.111'],
            [
                'kategori_item_id' => $kategori1->id,
                'nup' => '0111',
                'kode_bmn' => '3.10.01.02.003',
                'itemName' => 'Laptop HP 240 G6 Core i5',
                'merk_tipe' => 'HP 240 G6 Intel Core i5-7200U',
                'nomor_seri' => 'CND7482910',
                'tahunPerolehan' => 2022,
                'nilaiPerolehan' => 12000000.00,
                'nilai_buku' => 6000000.00,
                'kondisi' => 'baik',
                'status_penggunaan' => 'digunakan',
                'sifat_aset' => 'bergerak',
                'lokasi_ruangan' => 'L01.01.01 - Gudang / Subbag Umum & Keuangan',
                'unit_kerja' => 'Bagian Umum dan Keuangan',
                'penanggung_jawab' => 'Andi Agung Febrianto, S.STP, M.Kessos',
            ]
        );

        // Kendaraan 1 (Mobil Dinas Penyerahan)
        $item3 = Item::updateOrCreate(
            ['itemCode' => '3.02.01.01.002.17'],
            [
                'kategori_item_id' => $kategori2->id,
                'nup' => '0017',
                'kode_bmn' => '3.02.01.01.002',
                'itemName' => 'Honda CR-V 2.0 Prestige (Mobil Pengawasan)',
                'jenis_kendaraan' => 'Kendaraan Dinas Wheel Drive',
                'merk_tipe' => 'Honda CR-V 2.0 Prestige A/T',
                'nomor_seri' => 'MHFRW1880KJ001602',
                'no_rangka' => 'MHFRW1880KJ001602',
                'no_mesin' => 'L15BJ1132034',
                'nomor_polisi' => 'B 1072 PQI',
                'warna' => 'Hitam Metalik',
                'tahunPerolehan' => 2021,
                'nilaiPerolehan' => 535000000.00,
                'nilai_buku' => 334375000.00,
                'kondisi' => 'baik',
                'status_penggunaan' => 'digunakan',
                'sifat_aset' => 'bergerak',
                'lokasi_ruangan' => 'Pool Kendaraan Dinas Gedung Itjen',
                'unit_kerja' => 'Inspektorat Wilayah IV',
                'penanggung_jawab' => 'Dr. Arsan Latif, M.Si',
            ]
        );

        // 4. TRANSAKSI MUTASI LOKASI & BAST (SIAP CETAK 3 DOKUMEN BAST RESMI)
        MutasiLokasi::create([
            'item_id' => $item1->id,
            'lokasi_asal' => 'L01.01.01 - Gudang / Subbag Umum & Keuangan',
            'lokasi_tujuan' => 'L01.03.01 - Ruang Auditor Irwil III',
            'tanggal_mutasi' => '2026-01-15',
            'penanggung_jawab' => 'Dr. Drs. Andi Muhammad Yusuf, M.Si',
            'keterangan' => '[PENYERAHAN][KELENGKAPAN: 1 Unit charger; Tas Laptop] Penyerahan fasilitas kerja dinas Laptop HP ENVY X360 untuk Inspektur III.',
            'status_approval' => 'disetujui',
            'catatan_approval' => 'Disetujui untuk mendukung operasional pengawasan Irwil III.',
            'approved_by' => 'Andi Agung Febrianto, S.STP, M.Kessos',
        ]);

        MutasiLokasi::create([
            'item_id' => $item2->id,
            'lokasi_asal' => 'L01.01.02 - Ruang Staf Keuangan',
            'lokasi_tujuan' => 'L01.01.01 - Gudang / Subbag Umum & Keuangan',
            'tanggal_mutasi' => '2026-02-10',
            'penanggung_jawab' => 'Andi Agung Febrianto, S.STP, M.Kessos',
            'keterangan' => '[PENGEMBALIAN][KELENGKAPAN: 1. Charger; 2. Sleeve / Tas] Pengembalian unit laptop pasca selesai penataan laporan keuangan.',
            'status_approval' => 'disetujui',
            'catatan_approval' => 'Disetujui. Unit laptop disimpan di Gudang Subbag Umum.',
            'approved_by' => 'Andi Agung Febrianto, S.STP, M.Kessos',
        ]);

        MutasiLokasi::create([
            'item_id' => $item3->id,
            'lokasi_asal' => 'Pool Kendaraan Dinas Gedung Itjen',
            'lokasi_tujuan' => 'Inspektorat Wilayah IV',
            'tanggal_mutasi' => '2026-03-01',
            'penanggung_jawab' => 'Dr. Arsan Latif, M.Si',
            'keterangan' => '[PENYERAHAN][KELENGKAPAN: 1. Kunci Utama; 2. STNK Asli; 3. Ban Cadangan; 4. Dongkrak 1 Set] Penyerahan mobil dinas pengawasan Honda CR-V ke Inspektur Wilayah IV.',
            'status_approval' => 'disetujui',
            'catatan_approval' => 'Disetujui oleh Kabag Umum dan Keuangan.',
            'approved_by' => 'Andi Agung Febrianto, S.STP, M.Kessos',
        ]);

        // 5. TRANSAKSI PENGAJUAN SERVIS & NOTA DINAS
        PengajuanServis::create([
            'item_id' => $item1->id,
            'nama_barang_custom' => null,
            'nama_pemohon' => 'Dr. Drs. Andi Muhammad Yusuf, M.Si',
            'nip_pemohon' => '19730609 199311 1 002',
            'unit_kerja' => 'Inspektorat Wilayah III',
            'lokasi_barang' => 'Ruang Inspektur III Lt. 3',
            'kategori_servis' => 'ganti_sparepart',
            'nomor_nota_dinas' => '700.1.2/3/Insp III',
            'deskripsi_kerusakan' => 'Baterai Laptop Bocor dan kipas pendingin berbunyi bising saat pengetikan laporan pengawasan.',
            'tanggal_pengajuan' => '2026-01-06',
            'estimasi_biaya' => 1200000.00,
            'status' => 'disetujui_pimpinan',
            'catatan_operator' => 'Sudah divalidasi fisik oleh Operator TU. Diperlukan penggantian modul baterai original HP & thermal paste.',
            'verified_by_operator' => 'Operator TU Irwil III',
            'tanggal_verifikasi_operator' => '2026-01-06 10:15:00',
            'catatan_pimpinan' => 'Disetujui untuk segera dilaksanakan servis perbaikan menggunakan DIPA Bagian Umum.',
            'approved_by_pimpinan' => 'Dr. Ir. Bachril Bakri, M.App.Sc',
        ]);

        PengajuanServis::create([
            'item_id' => $item3->id,
            'nama_barang_custom' => null,
            'nama_pemohon' => 'Dr. Arsan Latif, M.Si',
            'nip_pemohon' => '19690905 199203 1 003',
            'unit_kerja' => 'Inspektorat Wilayah IV',
            'lokasi_barang' => 'Pool Kendaraan Dinas Gedung B',
            'kategori_servis' => 'tuneup_mesin',
            'nomor_nota_dinas' => '700.1.2/12/Insp IV',
            'deskripsi_kerusakan' => 'Servis berkala 50.000 KM, ganti oli mesin, ganti kampas rem depan/belakang, dan spooring balancing.',
            'tanggal_pengajuan' => '2026-02-15',
            'estimasi_biaya' => 4500000.00,
            'biaya_aktual' => 4500000.00,
            'status' => 'selesai',
            'catatan_operator' => 'Sudah dilakukan servis di bengkel resmi Honda.',
            'verified_by_operator' => 'Operator TU Irwil IV',
            'catatan_pimpinan' => 'Disetujui.',
            'approved_by_pimpinan' => 'Dr. Ir. Bachril Bakri, M.App.Sc',
        ]);

        // 6. RIWAYAT PENYUSUTAN (DEPRESIASI ASET 2026)
        Penyusutan::create([
            'item_id' => $item1->id,
            'tahun' => 2026,
            'nilaiAwal' => 18500000.00,
            'bebanPenyusutan' => 4625000.00,
            'akumulasiPenyusutan' => 13875000.00,
            'nilaiBukuAkhir' => 4625000.00,
            'persenUmur' => 75.00,
            'status' => 'evaluasi',
        ]);

        Penyusutan::create([
            'item_id' => $item3->id,
            'tahun' => 2026,
            'nilaiAwal' => 535000000.00,
            'bebanPenyusutan' => 66875000.00,
            'akumulasiPenyusutan' => 334375000.00,
            'nilaiBukuAkhir' => 200625000.00,
            'persenUmur' => 62.50,
            'status' => 'evaluasi',
        ]);
    }
}
