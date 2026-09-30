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
        Schema::table('items', function (Blueprint $table) {
            $table->string('jenis_kendaraan')->nullable()->after('itemName');
            $table->string('nomor_polisi')->nullable()->after('nomor_seri');
            $table->string('no_rangka')->nullable()->after('nomor_polisi');
            $table->string('no_mesin')->nullable()->after('no_rangka');
            $table->string('warna')->nullable()->after('no_mesin');
            $table->json('kelengkapan_standar')->nullable()->after('warna');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn([
                'jenis_kendaraan',
                'nomor_polisi',
                'no_rangka',
                'no_mesin',
                'warna',
                'kelengkapan_standar',
            ]);
        });
    }
};
