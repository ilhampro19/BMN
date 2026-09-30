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
        if (! Schema::hasTable('kategori_items')) {
            Schema::create('kategori_items', function (Blueprint $table) {
                $table->id();
                $table->string('kategoriItemCode')->unique();
                $table->string('kategoriItemName');
                $table->integer('umurEkonomisTahun')->default(5);
                $table->decimal('tarifPenyusutanPersen', 5, 2)->default(20.00);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('items')) {
            Schema::create('items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('kategori_item_id')->constrained('kategori_items')->onDelete('cascade');
                $table->string('itemCode')->unique();
                $table->string('nup', 50)->nullable();
                $table->string('kode_bmn', 100)->nullable();
                $table->string('itemName');
                $table->string('merk_tipe')->nullable();
                $table->string('nomor_seri')->nullable();
                $table->integer('tahunPerolehan')->nullable();
                $table->decimal('nilaiPerolehan', 15, 2)->default(0);
                $table->decimal('nilai_buku', 15, 2)->nullable();
                $table->string('kondisi')->default('baik');
                $table->string('status_penggunaan')->default('digunakan');
                $table->string('sifat_aset')->default('tetap');
                $table->string('lokasi_ruangan')->nullable();
                $table->string('unit_kerja')->default('Sekretariat Itjen');
                $table->string('penanggung_jawab')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('items');
        Schema::dropIfExists('kategori_items');
    }
};
