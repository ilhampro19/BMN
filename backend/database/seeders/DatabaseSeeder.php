<?php

namespace Database\Seeders;

use App\Models\Item;
use App\Models\KategoriItem;
use App\Models\PengajuanServis;
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

        // 2. Kategori BMN
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

        // 3. Items
        $item1 = Item::updateOrCreate(
            ['itemCode' => 'BMN-ITJ-2023-LTP01'],
            [
                'kategori_item_id' => $kategori1->id,
                'nup' => '0001',
                'kode_bmn' => '3.05.01.04.001',
                'itemName' => 'Laptop Auditor Lenovo ThinkPad T14s',
                'merk_tipe' => 'Lenovo ThinkPad T14s Gen 3',
                'nomor_seri' => 'PF48291X',
                'tahunPerolehan' => 2023,
                'nilaiPerolehan' => 24500000.00,
                'kondisi' => 'baik',
                'status_penggunaan' => 'digunakan',
                'lokasi_ruangan' => 'Ruang Auditor Irwil I Lt. 3',
                'unit_kerja' => 'Inspektorat Wilayah I',
                'penanggung_jawab' => 'Rahmat Hidayat, S.E. (Auditor Ahli Muda)',
            ]
        );

        $item2 = Item::updateOrCreate(
            ['itemCode' => 'BMN-ITJ-2022-MOB01'],
            [
                'kategori_item_id' => $kategori2->id,
                'nup' => '0001',
                'kode_bmn' => '3.01.01.01.002',
                'itemName' => 'Toyota Fortuner 2.8 VRZ (Mobil Pengawasan)',
                'merk_tipe' => 'Toyota Fortuner 2.8 VRZ A/T',
                'nomor_seri' => 'MHFFN43G8P901234',
                'tahunPerolehan' => 2022,
                'nilaiPerolehan' => 590000000.00,
                'kondisi' => 'baik',
                'status_penggunaan' => 'digunakan',
                'lokasi_ruangan' => 'Pool Kendaraan Dinas Gedung B',
                'unit_kerja' => 'Sekretariat Itjen',
                'penanggung_jawab' => 'Joko Susanto (Pengemudi Operasional)',
            ]
        );

        $item3 = Item::updateOrCreate(
            ['itemCode' => 'BMN-ITJ-2021-SRV01'],
            [
                'kategori_item_id' => $kategori1->id,
                'nup' => '0001',
                'kode_bmn' => '3.05.02.01.001',
                'itemName' => 'Server Database Sistem Pengawasan APIP',
                'merk_tipe' => 'Dell PowerEdge R750xs Rack Server',
                'nomor_seri' => 'CN-0K793H-72872',
                'tahunPerolehan' => 2021,
                'nilaiPerolehan' => 125000000.00,
                'kondisi' => 'evaluasi',
                'status_penggunaan' => 'digunakan',
                'lokasi_ruangan' => 'Data Center / Server Room Itjen Lt. 3',
                'unit_kerja' => 'Sekretariat Itjen',
                'penanggung_jawab' => 'Tim IT & Helpdesk Itjen',
            ]
        );

        $item4 = Item::updateOrCreate(
            ['itemCode' => 'BMN-ITJ-2020-MEJ01'],
            [
                'kategori_item_id' => $kategori3->id,
                'nup' => '0001',
                'kode_bmn' => '3.05.01.05.003',
                'itemName' => 'Set Meja Rapat Konferensi Paripurna',
                'merk_tipe' => 'Olympic Boardroom Series 24 Seat',
                'nomor_seri' => 'OLM-MEJ-2020-88',
                'tahunPerolehan' => 2020,
                'nilaiPerolehan' => 38000000.00,
                'kondisi' => 'baik',
                'status_penggunaan' => 'digunakan',
                'lokasi_ruangan' => 'Ruang Rapat Utama Ses Itjen Lt. 2',
                'unit_kerja' => 'Sekretariat Itjen',
                'penanggung_jawab' => 'Subbag Rumah Tangga',
            ]
        );

        $item5 = Item::updateOrCreate(
            ['itemCode' => 'BMN-ITJ-2023-LTP02'],
            [
                'kategori_item_id' => $kategori1->id,
                'nup' => '0002',
                'kode_bmn' => '3.05.01.04.001',
                'itemName' => 'Laptop Wasrik HP EliteBook 840 G9',
                'merk_tipe' => 'HP EliteBook 840 G9 i7-1260P',
                'nomor_seri' => '5CG249219K',
                'tahunPerolehan' => 2023,
                'nilaiPerolehan' => 22000000.00,
                'kondisi' => 'baik',
                'status_penggunaan' => 'dipinjam_wasrik',
                'lokasi_ruangan' => 'Ruang Auditor Irwil II Lt. 4',
                'unit_kerja' => 'Inspektorat Wilayah II',
                'penanggung_jawab' => 'Siti Aminah, S.E., M.Si (Auditor Madya)',
            ]
        );

        // 5. Pengajuan Servis (Alur Staf -> Operator -> Pimpinan)
        PengajuanServis::updateOrCreate(
            ['deskripsi_kerusakan' => 'Layar laptop bergaris dan keyboard huruf E dan Spasi macet saat pengetikan laporan.'],
            [
                'item_id' => $item1->id,
                'nama_barang_custom' => null,
                'nama_pemohon' => 'Budi Santoso, S.Sos',
                'nip_pemohon' => '199003152014031002',
                'unit_kerja' => 'Bagian Umum & Kepegawaian',
                'lokasi_barang' => 'Ruang Staf Bagian Umum Lt. 2',
                'kategori_servis' => 'ganti_sparepart',
                'tanggal_pengajuan' => '2024-09-05',
                'status' => 'diajukan',
                'estimasi_biaya' => 1200000.00,
            ]
        );

        PengajuanServis::updateOrCreate(
            ['deskripsi_kerusakan' => 'Kipas pendingin server berbunyi sangat bising dan suhu CPU sering overheat.'],
            [
                'item_id' => $item3->id,
                'nama_barang_custom' => null,
                'nama_pemohon' => 'Budi Santoso, S.Sos',
                'nip_pemohon' => '199003152014031002',
                'unit_kerja' => 'Bagian Umum & Kepegawaian',
                'lokasi_barang' => 'Data Center / Server Room Itjen Lt. 3',
                'kategori_servis' => 'perbaikan_ringan',
                'tanggal_pengajuan' => '2024-09-02',
                'status' => 'diverifikasi_operator',
                'estimasi_biaya' => 2500000.00,
                'catatan_operator' => 'Sudah dicek fisik di Server Room. Perlu pembersihan fan & penggantian pasta pendingin thermal.',
                'verified_by_operator' => 'Operator TU Irwil I',
                'tanggal_verifikasi_operator' => '2024-09-03 10:30:00',
            ]
        );
    }
}
