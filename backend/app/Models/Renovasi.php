<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Renovasi extends Model
{
    protected $table = 'renovasis';

    protected $fillable = [
        'item_id',
        'tanggal_renovasi',
        'biaya_renovasi',
        'tambah_umur_tahun',
        'kapitalisasi',
        'deskripsi',
    ];

    protected $casts = [
        'tanggal_renovasi' => 'date:Y-m-d',
        'biaya_renovasi' => 'float',
        'tambah_umur_tahun' => 'integer',
        'kapitalisasi' => 'boolean',
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
