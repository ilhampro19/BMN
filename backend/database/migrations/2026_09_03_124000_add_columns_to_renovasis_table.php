<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('renovasis', function (Blueprint $table) {
            if (! Schema::hasColumn('renovasis', 'kapitalisasi')) {
                $table->boolean('kapitalisasi')->default(true)->after('tambah_umur_tahun');
            }
            if (! Schema::hasColumn('renovasis', 'created_at')) {
                $table->timestamps();
            }
        });
    }

    public function down(): void
    {
        Schema::table('renovasis', function (Blueprint $table) {
            if (Schema::hasColumn('renovasis', 'kapitalisasi')) {
                $table->dropColumn('kapitalisasi');
            }
            if (Schema::hasColumn('renovasis', 'created_at')) {
                $table->dropTimestamps();
            }
        });
    }
};
