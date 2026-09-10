<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\KategoriItemController;
use App\Http\Controllers\MutasiLokasiController;
use App\Http\Controllers\PeminjamanWasrikController;
use App\Http\Controllers\PengajuanServisController;
use App\Http\Controllers\PenyusutanController;
use App\Http\Controllers\RenovasiController;
use Illuminate\Support\Facades\Route;

// Auth Routes
Route::post('/users/login', [AuthController::class, 'login']);

// Kategori Item Routes
Route::get('/kategori-item', [KategoriItemController::class, 'index']);
Route::post('/kategori-item', [KategoriItemController::class, 'store']);
Route::get('/kategori-item/{id}', [KategoriItemController::class, 'show']);
Route::put('/kategori-item/{id}', [KategoriItemController::class, 'update']);
Route::delete('/kategori-item/{id}', [KategoriItemController::class, 'destroy']);

// Item (Barang) Routes
Route::get('/item', [ItemController::class, 'index']);
Route::post('/item', [ItemController::class, 'store']);
Route::post('/item/import', [ItemController::class, 'importBatch']);
Route::get('/item/{id}', [ItemController::class, 'show']);
Route::put('/item/{id}', [ItemController::class, 'update']);
Route::delete('/item/{id}', [ItemController::class, 'destroy']);

// Penyusutan Routes
Route::get('/penyusutan', [PenyusutanController::class, 'index']);
Route::post('/penyusutan', [PenyusutanController::class, 'store']);

// Renovasi & Pemeliharaan Routes
Route::get('/renovasi', [RenovasiController::class, 'index']);
Route::post('/renovasi', [RenovasiController::class, 'store']);
Route::delete('/renovasi/{id}', [RenovasiController::class, 'destroy']);

// Mutasi & Pelacakan Lokasi Routes
Route::get('/mutasi-lokasi', [MutasiLokasiController::class, 'index']);
Route::post('/mutasi-lokasi', [MutasiLokasiController::class, 'store']);
Route::post('/mutasi-lokasi/{id}/approve', [MutasiLokasiController::class, 'approve']);
Route::post('/mutasi-lokasi/{id}/reject', [MutasiLokasiController::class, 'reject']);
Route::delete('/mutasi-lokasi/{id}', [MutasiLokasiController::class, 'destroy']);

// Peminjaman Wasrik (Audit Luar) Routes
Route::get('/peminjaman-wasrik', [PeminjamanWasrikController::class, 'index']);
Route::post('/peminjaman-wasrik', [PeminjamanWasrikController::class, 'store']);
Route::get('/peminjaman-wasrik/{id}', [PeminjamanWasrikController::class, 'show']);
Route::post('/peminjaman-wasrik/{id}/approve', [PeminjamanWasrikController::class, 'approve']);
Route::post('/peminjaman-wasrik/{id}/reject', [PeminjamanWasrikController::class, 'reject']);
Route::post('/peminjaman-wasrik/{id}/kembali', [PeminjamanWasrikController::class, 'kembali']);
Route::delete('/peminjaman-wasrik/{id}', [PeminjamanWasrikController::class, 'destroy']);

// Pengajuan Servis (Staf -> Operator -> Pimpinan) Routes
Route::get('/pengajuan-servis', [PengajuanServisController::class, 'index']);
Route::post('/pengajuan-servis', [PengajuanServisController::class, 'store']);
Route::get('/pengajuan-servis/{id}', [PengajuanServisController::class, 'show']);
Route::post('/pengajuan-servis/{id}/verify', [PengajuanServisController::class, 'verify']);
Route::post('/pengajuan-servis/{id}/reject-operator', [PengajuanServisController::class, 'rejectOperator']);
Route::post('/pengajuan-servis/{id}/approve', [PengajuanServisController::class, 'approvePimpinan']);
Route::post('/pengajuan-servis/{id}/reject', [PengajuanServisController::class, 'rejectPimpinan']);
Route::post('/pengajuan-servis/{id}/selesai', [PengajuanServisController::class, 'selesai']);
Route::delete('/pengajuan-servis/{id}', [PengajuanServisController::class, 'destroy']);
