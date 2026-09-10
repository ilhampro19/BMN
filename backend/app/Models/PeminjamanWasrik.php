<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PeminjamanWasrik extends Model
{
    protected $table = 'peminjaman_wasriks';

    protected $fillable = [
        'item_id',
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
        'catatan_approval',
        'approved_by',
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
