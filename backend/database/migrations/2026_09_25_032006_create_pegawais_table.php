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
        if (! Schema::hasTable('pegawais')) {
            Schema::create('pegawais', function (Blueprint $table) {
                $table->id();
                $table->string('nip', 100)->nullable()->index();
                $table->string('nama', 255);
                $table->string('jabatan', 255)->nullable();
                $table->string('unit_kerja', 255)->nullable();
                $table->string('no_hp', 50)->nullable();
                $table->string('email', 100)->nullable();
                $table->string('status', 50)->default('aktif');
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
        Schema::dropIfExists('pegawais');
    }
};
