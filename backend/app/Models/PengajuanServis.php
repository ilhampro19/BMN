<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PengajuanServis extends Model
{
    protected $table = 'pengajuan_servis';

    protected $fillable = [
        'item_id',
        'nama_barang_custom',
        'nama_pemohon',
        'nip_pemohon',
        'unit_kerja',
        'lokasi_barang',
        'kategori_servis',
        'deskripsi_kerusakan',
        'tanggal_pengajuan',
        'nomor_nota_dinas',
        'status',
        'estimasi_biaya',
        'catatan_operator',
        'verified_by_operator',
        'tanggal_verifikasi_operator',
        'catatan_pimpinan',
        'approved_by_pimpinan',
        'tanggal_approval_pimpinan',
    ];

    protected $casts = [
        'estimasi_biaya' => 'float',
        'tanggal_verifikasi_operator' => 'datetime',
        'tanggal_approval_pimpinan' => 'datetime',
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
