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
            if (! Schema::hasColumn('peminjaman_wasriks', 'catatan_approval')) {
                $table->text('catatan_approval')->nullable()->after('keterangan');
            }
            if (! Schema::hasColumn('peminjaman_wasriks', 'approved_by')) {
                $table->string('approved_by')->nullable()->after('catatan_approval');
            }
        });

        Schema::table('mutasi_lokasis', function (Blueprint $table) {
            if (! Schema::hasColumn('mutasi_lokasis', 'status_approval')) {
                $table->string('status_approval')->default('disetujui')->after('keterangan');
            }
            if (! Schema::hasColumn('mutasi_lokasis', 'catatan_approval')) {
                $table->text('catatan_approval')->nullable()->after('status_approval');
            }
            if (! Schema::hasColumn('mutasi_lokasis', 'approved_by')) {
                $table->string('approved_by')->nullable()->after('catatan_approval');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('peminjaman_wasriks', function (Blueprint $table) {
            if (Schema::hasColumn('peminjaman_wasriks', 'catatan_approval')) {
                $table->dropColumn('catatan_approval');
            }
            if (Schema::hasColumn('peminjaman_wasriks', 'approved_by')) {
                $table->dropColumn('approved_by');
            }
        });

        Schema::table('mutasi_lokasis', function (Blueprint $table) {
            if (Schema::hasColumn('mutasi_lokasis', 'status_approval')) {
                $table->dropColumn('status_approval');
            }
            if (Schema::hasColumn('mutasi_lokasis', 'catatan_approval')) {
                $table->dropColumn('catatan_approval');
            }
            if (Schema::hasColumn('mutasi_lokasis', 'approved_by')) {
                $table->dropColumn('approved_by');
            }
        });
    }
};
