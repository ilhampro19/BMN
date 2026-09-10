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
        if (! Schema::hasTable('mutasi_lokasis')) {
            Schema::create('mutasi_lokasis', function (Blueprint $table) {
                $table->id();
                $table->foreignId('item_id')->constrained('items')->onDelete('cascade');
                $table->string('lokasi_asal')->nullable();
                $table->string('lokasi_tujuan');
                $table->date('tanggal_mutasi');
                $table->string('penanggung_jawab')->nullable();
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
        Schema::dropIfExists('mutasi_lokasis');
    }
};
