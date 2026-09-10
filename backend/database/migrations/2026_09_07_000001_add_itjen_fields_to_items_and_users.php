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
            if (! Schema::hasColumn('items', 'nup')) {
                $table->string('nup', 50)->nullable()->after('itemCode');
            }
            if (! Schema::hasColumn('items', 'kode_bmn')) {
                $table->string('kode_bmn', 100)->nullable()->after('nup');
            }
            if (! Schema::hasColumn('items', 'merk_tipe')) {
                $table->string('merk_tipe', 255)->nullable()->after('itemName');
            }
            if (! Schema::hasColumn('items', 'nomor_seri')) {
                $table->string('nomor_seri', 100)->nullable()->after('merk_tipe');
            }
            if (! Schema::hasColumn('items', 'unit_kerja')) {
                $table->string('unit_kerja', 255)->nullable()->default('Sekretariat Itjen')->after('lokasi_ruangan');
            }
            if (! Schema::hasColumn('items', 'status_penggunaan')) {
                $table->string('status_penggunaan', 50)->default('digunakan')->after('kondisi');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'role')) {
                $table->string('role')->default('admin');
            }
            if (! Schema::hasColumn('users', 'unit_kerja')) {
                $table->string('unit_kerja')->nullable()->default('Sekretariat Itjen');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $cols = ['nup', 'kode_bmn', 'merk_tipe', 'nomor_seri', 'unit_kerja', 'status_penggunaan'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('items', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
