<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MutasiLokasi extends Model
{
    protected $table = 'mutasi_lokasis';

    protected $fillable = [
        'item_id',
        'lokasi_asal',
        'lokasi_tujuan',
        'tanggal_mutasi',
        'penanggung_jawab',
        'keterangan',
        'status_approval',
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
