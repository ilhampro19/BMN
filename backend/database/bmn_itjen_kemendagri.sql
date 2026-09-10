-- =====================================================================
-- DATABASE SCHEMA & SEEDER: SISTEM BMN ITJEN KEMENDAGRI
-- Database: bmn_system
-- Format: MySQL / MariaDB (phpMyAdmin Ready)
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `peminjaman_wasriks`;
DROP TABLE IF EXISTS `mutasi_lokasis`;
DROP TABLE IF EXISTS `renovasis`;
DROP TABLE IF EXISTS `penyusutans`;
DROP TABLE IF EXISTS `items`;
DROP TABLE IF EXISTS `kategori_items`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. TABEL USERS (4 ROLE KHAS ITJEN KEMENDAGRI)
-- ---------------------------------------------------------------------
CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL UNIQUE,
  `role` enum('admin','operator','auditor','pimpinan') NOT NULL DEFAULT 'admin',
  `unit_kerja` varchar(255) DEFAULT 'Sekretariat Itjen',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. TABEL KATEGORI ITEMS (ATURAN PENYUSUTAN & UMUR EKONOMIS)
-- ---------------------------------------------------------------------
CREATE TABLE `kategori_items` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `kategoriItemCode` varchar(50) NOT NULL UNIQUE,
  `kategoriItemName` varchar(255) NOT NULL,
  `umurEkonomisTahun` int(11) NOT NULL DEFAULT 5,
  `tarifPenyusutanPersen` decimal(5,2) NOT NULL DEFAULT 20.00,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. TABEL ITEMS (MASTER BMN LENGKAP: NUP, SAKTI, NO SERI, UNIT KERJA)
-- ---------------------------------------------------------------------
CREATE TABLE `items` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `kategori_item_id` bigint(20) UNSIGNED NULL,
  `itemCode` varchar(100) NOT NULL UNIQUE,
  `nup` varchar(50) DEFAULT '0001',
  `kode_bmn` varchar(100) DEFAULT '3.05.01.04.001',
  `itemName` varchar(255) NOT NULL,
  `merk_tipe` varchar(255) DEFAULT NULL,
  `nomor_seri` varchar(100) DEFAULT NULL,
  `tahunPerolehan` int(11) NOT NULL,
  `nilaiPerolehan` decimal(15,2) NOT NULL,
  `kondisi` enum('baik','evaluasi','perhatian') NOT NULL DEFAULT 'baik',
  `status_penggunaan` enum('digunakan','dipinjam_wasrik','rusak_berat') NOT NULL DEFAULT 'digunakan',
  `lokasi_ruangan` varchar(255) DEFAULT NULL,
  `unit_kerja` varchar(255) DEFAULT 'Sekretariat Itjen',
  `penanggung_jawab` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_items_kategori` (`kategori_item_id`),
  CONSTRAINT `fk_items_kategori` FOREIGN KEY (`kategori_item_id`) REFERENCES `kategori_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. TABEL PENYUSUTANS (LOG KALKULASI DEPRESIASI NILAI BUKU)
-- ---------------------------------------------------------------------
CREATE TABLE `penyusutans` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `item_id` bigint(20) UNSIGNED NOT NULL,
  `tahun` int(11) NOT NULL,
  `nilaiAwal` decimal(15,2) NOT NULL,
  `bebanPenyusutan` decimal(15,2) NOT NULL,
  `akumulasiPenyusutan` decimal(15,2) NOT NULL,
  `nilaiBukuAkhir` decimal(15,2) NOT NULL,
  `persenUmur` decimal(5,2) NOT NULL,
  `status` enum('baik','evaluasi','perhatian') NOT NULL DEFAULT 'baik',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_penyusutan_item` (`item_id`),
  CONSTRAINT `fk_penyusutan_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. TABEL RENOVASIS (RIWAYAT PEMELIHARAAN / SERVIS)
-- ---------------------------------------------------------------------
CREATE TABLE `renovasis` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `item_id` bigint(20) UNSIGNED NOT NULL,
  `tanggal_renovasi` date NOT NULL,
  `biaya_renovasi` decimal(15,2) NOT NULL,
  `tambah_umur_tahun` int(11) NOT NULL DEFAULT 0,
  `kapitalisasi` tinyint(1) NOT NULL DEFAULT 1,
  `deskripsi` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_renovasi_item` (`item_id`),
  CONSTRAINT `fk_renovasi_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. TABEL MUTASI_LOKASIS (PELACAKAN & JEJAK PERPINDAHAN FISIK ASET)
-- ---------------------------------------------------------------------
CREATE TABLE `mutasi_lokasis` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `item_id` bigint(20) UNSIGNED NOT NULL,
  `lokasi_asal` varchar(255) DEFAULT 'Belum Ditentukan',
  `lokasi_tujuan` varchar(255) NOT NULL,
  `tanggal_mutasi` date NOT NULL,
  `penanggung_jawab` varchar(255) DEFAULT NULL,
  `keterangan` text DEFAULT NULL,
  `status_approval` varchar(50) NOT NULL DEFAULT 'disetujui',
  `catatan_approval` text DEFAULT NULL,
  `approved_by` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_mutasi_item` (`item_id`),
  CONSTRAINT `fk_mutasi_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. TABEL PEMINJAMAN_WASRIKS (PEMINJAMAN TUGAS AUDIT LAPANGAN)
-- ---------------------------------------------------------------------
CREATE TABLE `peminjaman_wasriks` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `item_id` bigint(20) UNSIGNED NOT NULL,
  `nama_peminjam` varchar(255) NOT NULL,
  `nip_peminjam` varchar(50) DEFAULT NULL,
  `jabatan_tim` varchar(100) DEFAULT 'Anggota Tim Wasrik',
  `no_surat_tugas` varchar(255) NOT NULL,
  `tujuan_wilayah` varchar(255) NOT NULL,
  `tanggal_berangkat` date NOT NULL,
  `tanggal_kembali` date NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'diajukan',
  `kondisi_kembali` varchar(50) DEFAULT NULL,
  `keterangan` text DEFAULT NULL,
  `catatan_approval` text DEFAULT NULL,
  `approved_by` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_peminjaman_item` (`item_id`),
  CONSTRAINT `fk_peminjaman_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- DATA AWAL (SEEDER) KHAS ITJEN KEMENDAGRI
-- =====================================================================

-- 1. Akun Pengguna 4 Role (Password default: password123)
INSERT INTO `users` (`id`, `name`, `email`, `role`, `unit_kerja`, `password`) VALUES
(1, 'Admin BMN Itjen', 'admin.bmn@kemendagri.go.id', 'admin', 'Subbag BMN & Rumah Tangga', '$2y$12$N2aV16c7qg1pQ4kF1R9FuuH3Y9F2l1nE3X1j2k3l4m5n6o7p8q9r.'),
(2, 'Operator TU Irwil I', 'operator.irwil1@kemendagri.go.id', 'operator', 'Inspektorat Wilayah I', '$2y$12$N2aV16c7qg1pQ4kF1R9FuuH3Y9F2l1nE3X1j2k3l4m5n6o7p8q9r.'),
(3, 'Rahmat Hidayat, S.E.', 'auditor.rahmat@kemendagri.go.id', 'auditor', 'Inspektorat Wilayah I', '$2y$12$N2aV16c7qg1pQ4kF1R9FuuH3Y9F2l1nE3X1j2k3l4m5n6o7p8q9r.'),
(4, 'Inspektur Jenderal Kemendagri', 'irjen@kemendagri.go.id', 'pimpinan', 'Pimpinan Itjen', '$2y$12$N2aV16c7qg1pQ4kF1R9FuuH3Y9F2l1nE3X1j2k3l4m5n6o7p8q9r.');

-- 2. Kategori Barang Milik Negara Standar SAKTI
INSERT INTO `kategori_items` (`id`, `kategoriItemCode`, `kategoriItemName`, `umurEkonomisTahun`, `tarifPenyusutanPersen`) VALUES
(1, 'KAT-TIK', 'Peralatan Komputer & TI Pengawasan', 4, 25.00),
(2, 'KAT-KND', 'Kendaraan Operasional Pengawasan', 8, 12.50),
(3, 'KAT-MBL', 'Mebel & Alat Kantor', 5, 20.00),
(4, 'KAT-BGN', 'Gedung & Bangunan Kantor Itjen', 20, 5.00);

-- 3. Master Barang Milik Negara Itjen Kemendagri
INSERT INTO `items` (`id`, `kategori_item_id`, `itemCode`, `nup`, `kode_bmn`, `itemName`, `merk_tipe`, `nomor_seri`, `tahunPerolehan`, `nilaiPerolehan`, `kondisi`, `status_penggunaan`, `lokasi_ruangan`, `unit_kerja`, `penanggung_jawab`) VALUES
(1, 1, 'BMN-ITJ-2023-LTP01', '0001', '3.05.01.04.001', 'Laptop Auditor Lenovo ThinkPad T14s', 'Lenovo ThinkPad T14s Gen 3', 'PF48291X', 2023, 24500000.00, 'baik', 'digunakan', 'Ruang Auditor Irwil I Lt. 3', 'Inspektorat Wilayah I', 'Rahmat Hidayat, S.E. (Auditor Ahli Muda)'),
(2, 2, 'BMN-ITJ-2022-MOB01', '0001', '3.01.01.01.002', 'Toyota Fortuner 2.8 VRZ (Mobil Pengawasan)', 'Toyota Fortuner 2.8 VRZ A/T', 'MHFFN43G8P901234', 2022, 590000000.00, 'baik', 'digunakan', 'Pool Kendaraan Dinas Gedung B', 'Sekretariat Itjen', 'Joko Susanto (Pengemudi Operasional)'),
(3, 1, 'BMN-ITJ-2021-SRV01', '0001', '3.05.02.01.001', 'Server Database Sistem Pengawasan APIP', 'Dell PowerEdge R750xs Rack Server', 'CN-0K793H-72872', 2021, 125000000.00, 'evaluasi', 'digunakan', 'Data Center / Server Room Itjen Lt. 3', 'Sekretariat Itjen', 'Tim IT & Helpdesk Itjen'),
(4, 3, 'BMN-ITJ-2020-MEJ01', '0001', '3.05.01.05.003', 'Set Meja Rapat Konferensi Paripurna', 'Olympic Boardroom Series 24 Seat', 'OLM-MEJ-2020-88', 2020, 38000000.00, 'baik', 'digunakan', 'Ruang Rapat Utama Ses Itjen Lt. 2', 'Sekretariat Itjen', 'Subbag Rumah Tangga'),
(5, 1, 'BMN-ITJ-2023-LTP02', '0002', '3.05.01.04.001', 'Laptop Wasrik HP EliteBook 840 G9', 'HP EliteBook 840 G9 i7-1260P', '5CG249219K', 2023, 22000000.00, 'baik', 'dipinjam_wasrik', 'Ruang Auditor Irwil II Lt. 4', 'Inspektorat Wilayah II', 'Siti Aminah, S.E., M.Si (Auditor Madya)');

-- 4. Riwayat Penyusutan Awal
INSERT INTO `penyusutans` (`id`, `item_id`, `tahun`, `nilaiAwal`, `bebanPenyusutan`, `akumulasiPenyusutan`, `nilaiBukuAkhir`, `persenUmur`, `status`) VALUES
(1, 1, 2024, 24500000.00, 6125000.00, 6125000.00, 18375000.00, 25.00, 'baik'),
(2, 3, 2024, 125000000.00, 31250000.00, 93750000.00, 31250000.00, 75.00, 'evaluasi');

-- 5. Riwayat Renovasi / Pemeliharaan Kapitalisasi
INSERT INTO `renovasis` (`id`, `item_id`, `tanggal_renovasi`, `biaya_renovasi`, `tambah_umur_tahun`, `kapitalisasi`, `deskripsi`) VALUES
(1, 3, '2024-03-15', 18000000.00, 2, 1, 'Penggantian Storage NVMe Server dan Power Supply Redundant untuk kestabilan sistem audit');

-- 6. Riwayat Mutasi / Perpindahan Fisik Barang
INSERT INTO `mutasi_lokasis` (`id`, `item_id`, `lokasi_asal`, `lokasi_tujuan`, `tanggal_mutasi`, `penanggung_jawab`, `keterangan`) VALUES
(1, 1, 'Gudang Perlengkapan BMN Lt. 1', 'Ruang Auditor Irwil I Lt. 3', '2023-08-10', 'Rahmat Hidayat, S.E.', 'Distribusi unit laptop baru untuk pelaksanaan audit kinerja Pemda');

-- 7. Riwayat Peminjaman Wasrik Lapangan
INSERT INTO `peminjaman_wasriks` (`id`, `item_id`, `nama_peminjam`, `nip_peminjam`, `jabatan_tim`, `no_surat_tugas`, `tujuan_wilayah`, `tanggal_berangkat`, `tanggal_kembali`, `status`, `kondisi_kembali`, `keterangan`) VALUES
(1, 5, 'Siti Aminah, S.E., M.Si', '198204122006042001', 'Ketua Tim Wasrik Wilayah II', 'ST.090/1422/IJ/2024', 'Pemeriksaan Reguler Pemkab Banyuwangi', '2024-09-01', '2024-09-12', 'dipinjam', NULL, 'Peminjaman unit laptop dinas untuk audit lapangan');

-- =====================================================================
-- SELESAI
-- =====================================================================
