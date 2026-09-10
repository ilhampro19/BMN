<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'Selamat datang di Sistem Informasi Manajemen Aset BMN Itjen Kemendagri API!',
        'version' => '1.0.0',
        'endpoints' => [
            'auth' => '/api/users/login',
            'items' => '/api/item',
            'kategori' => '/api/kategori-item',
            'servis' => '/api/pengajuan-servis',
            'mutasi' => '/api/mutasi-lokasi',
            'wasrik' => '/api/peminjaman-wasrik',
            'penyusutan' => '/api/penyusutan',
            'renovasi' => '/api/renovasi',
        ],
    ]);
});
