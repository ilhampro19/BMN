<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pengajuan_servis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->nullable()->constrained('items')->nullOnDelete();
            $table->string('nama_barang_custom')->nullable();
            $table->string('nama_pemohon');
            $table->string('nip_pemohon')->nullable();
            $table->string('unit_kerja')->default('Sekretariat Itjen');
            $table->string('lokasi_barang')->nullable();
            $table->string('kategori_servis')->default('perbaikan_ringan');
            $table->text('deskripsi_kerusakan');
            $table->date('tanggal_pengajuan');
            $table->string('status')->default('diajukan'); // diajukan, diverifikasi_operator, disetujui_pimpinan, ditolak_operator, ditolak_pimpinan, selesai
            $table->decimal('estimasi_biaya', 15, 2)->nullable();

            // Tahap 1: Verifikasi Operator
            $table->text('catatan_operator')->nullable();
            $table->string('verified_by_operator')->nullable();
            $table->dateTime('tanggal_verifikasi_operator')->nullable();

            // Tahap 2: Persetujuan Pimpinan
            $table->text('catatan_pimpinan')->nullable();
            $table->string('approved_by_pimpinan')->nullable();
            $table->dateTime('tanggal_approval_pimpinan')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pengajuan_servis');
    }
};
