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
        if (! Schema::hasTable('peminjaman_wasriks')) {
            Schema::create('peminjaman_wasriks', function (Blueprint $table) {
                $table->id();
                $table->foreignId('item_id')->constrained('items')->onDelete('cascade');
                $table->string('nama_peminjam');
                $table->string('nip_peminjam')->nullable();
                $table->string('jabatan_tim')->nullable(); // contoh: Ketua Tim Wasrik, Anggota Tim
                $table->string('no_surat_tugas');
                $table->string('tujuan_wilayah'); // contoh: Pemkab Banyuwangi, Pemprov Sumut
                $table->date('tanggal_berangkat');
                $table->date('tanggal_kembali');
                $table->string('status')->default('dipinjam'); // dipinjam, kembali
                $table->string('kondisi_kembali')->nullable(); // baik, evaluasi, perhatian
                $table->text('keterangan')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('peminjaman_wasriks');
    }
};
