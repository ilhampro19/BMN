<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PeminjamanWasrik extends Model
{
    protected $table = 'peminjaman_wasriks';

    protected $fillable = [
        'item_id',
        'tipe_peminjaman',
        'jenis_kendaraan',
        'nomor_polisi',
        'warna',
        'no_rangka',
        'no_mesin',
        'tahun_pembuatan',
        'kelengkapan',
        'nama_peminjam',
        'nip_peminjam',
        'jabatan_tim',
        'no_surat_tugas',
        'tujuan_wilayah',
        'tanggal_berangkat',
        'tanggal_kembali',
        'status',
        'kondisi_kembali',
        'keterangan',
        'pihak_pertama_nama',
        'pihak_pertama_nip',
        'pihak_pertama_jabatan',
        'mengetahui_nama',
        'mengetahui_nip',
        'mengetahui_jabatan',
        'catatan_approval',
        'approved_by',
    ];

    protected $casts = [
        'kelengkapan' => 'array',
    ];

    public function toArray()
    {
        $array = parent::toArray();
        $array['_id'] = $this->id;

        return $array;
    }

    public function item()
    {
        return $this->belongsTo(Item::class, 'item_id');
    }
}
