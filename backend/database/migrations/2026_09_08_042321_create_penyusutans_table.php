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
        if (! Schema::hasTable('penyusutans')) {
            Schema::create('penyusutans', function (Blueprint $table) {
                $table->id();
                $table->foreignId('item_id')->constrained('items')->onDelete('cascade');
                $table->integer('tahun');
                $table->decimal('nilaiAwal', 15, 2)->default(0);
                $table->decimal('bebanPenyusutan', 15, 2)->default(0);
                $table->decimal('akumulasiPenyusutan', 15, 2)->default(0);
                $table->decimal('nilaiBukuAkhir', 15, 2)->default(0);
                $table->decimal('persenUmur', 5, 2)->default(0);
                $table->string('status', 50)->default('baik');
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('penyusutans');
    }
};
