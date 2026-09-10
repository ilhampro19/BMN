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
            if (! Schema::hasColumn('items', 'lokasi_ruangan')) {
                $table->string('lokasi_ruangan')->nullable()->after('kondisi');
            }
            if (! Schema::hasColumn('items', 'penanggung_jawab')) {
                $table->string('penanggung_jawab')->nullable()->after('lokasi_ruangan');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            if (Schema::hasColumn('items', 'lokasi_ruangan')) {
                $table->dropColumn('lokasi_ruangan');
            }
            if (Schema::hasColumn('items', 'penanggung_jawab')) {
                $table->dropColumn('penanggung_jawab');
            }
        });
    }
};
