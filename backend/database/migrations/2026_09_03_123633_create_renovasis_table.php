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
        if (! Schema::hasTable('renovasis')) {
            Schema::create('renovasis', function (Blueprint $table) {
                $table->id();
                $table->foreignId('item_id')->constrained('items')->onDelete('cascade');
                $table->date('tanggal_renovasi');
                $table->decimal('biaya_renovasi', 15, 2);
                $table->integer('tambah_umur_tahun')->default(0);
                $table->boolean('kapitalisasi')->default(true);
                $table->text('deskripsi')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('renovasis');
    }
};
