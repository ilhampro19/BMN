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
        Schema::table('peminjaman_wasriks', function (Blueprint $table) {
            if (! Schema::hasColumn('peminjaman_wasriks', 'tipe_peminjaman')) {
                $table->string('tipe_peminjaman')->default('wasrik')->after('item_id'); // 'wasrik' | 'kendaraan'
            }
            if (! Schema::hasColumn('peminjaman_wasriks', 'jenis_kendaraan')) {
                $table->string('jenis_kendaraan')->nullable()->after('tipe_peminjaman'); // Sepeda Motor, Mobil Dinas Operasional
            }
            if (! Schema::hasColumn('peminjaman_wasriks', 'nomor_polisi')) {
                $table->string('nomor_polisi')->nullable()->after('jenis_kendaraan');
            }
            if (! Schema::hasColumn('peminjaman_wasriks', 'warna')) {
                $table->string('warna')->nullable()->after('nomor_polisi');
            }
            if (! Schema::hasColumn('peminjaman_wasriks', 'no_rangka')) {
                $table->string('no_rangka')->nullable()->after('warna');
            }
            if (! Schema::hasColumn('peminjaman_wasriks', 'no_mesin')) {
                $table->string('no_mesin')->nullable()->after('no_rangka');
            }
            if (! Schema::hasColumn('peminjaman_wasriks', 'tahun_pembuatan')) {
                $table->string('tahun_pembuatan')->nullable()->after('no_mesin');
            }
            if (! Schema::hasColumn('peminjaman_wasriks', 'kelengkapan')) {
                $table->text('kelengkapan')->nullable()->after('tahun_pembuatan'); // JSON array of items
            }
            if (! Schema::hasColumn('peminjaman_wasriks', 'pihak_pertama_nama')) {
                $table->string('pihak_pertama_nama')->nullable()->after('keterangan');
            }
            if (! Schema::hasColumn('peminjaman_wasriks', 'pihak_pertama_nip')) {
                $table->string('pihak_pertama_nip')->nullable()->after('pihak_pertama_nama');
            }
            if (! Schema::hasColumn('peminjaman_wasriks', 'pihak_pertama_jabatan')) {
                $table->string('pihak_pertama_jabatan')->nullable()->after('pihak_pertama_nip');
            }
            if (! Schema::hasColumn('peminjaman_wasriks', 'mengetahui_nama')) {
                $table->string('mengetahui_nama')->nullable()->after('pihak_pertama_jabatan');
            }
            if (! Schema::hasColumn('peminjaman_wasriks', 'mengetahui_nip')) {
                $table->string('mengetahui_nip')->nullable()->after('mengetahui_nama');
            }
            if (! Schema::hasColumn('peminjaman_wasriks', 'mengetahui_jabatan')) {
                $table->string('mengetahui_jabatan')->nullable()->after('mengetahui_nip');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('peminjaman_wasriks', function (Blueprint $table) {
            $columns = [
                'tipe_peminjaman',
                'jenis_kendaraan',
                'nomor_polisi',
                'warna',
                'no_rangka',
                'no_mesin',
                'tahun_pembuatan',
                'kelengkapan',
                'pihak_pertama_nama',
                'pihak_pertama_nip',
                'pihak_pertama_jabatan',
                'mengetahui_nama',
                'mengetahui_nip',
                'mengetahui_jabatan',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('peminjaman_wasriks', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
