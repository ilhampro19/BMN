<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Penyusutan extends Model
{
    protected $table = 'penyusutans';

    protected $fillable = [
        'item_id',
        'tahun',
        'nilaiAwal',
        'bebanPenyusutan',
        'akumulasiPenyusutan',
        'nilaiBukuAkhir',
        'persenUmur',
        'status',
    ];

    protected $casts = [
        'tahun' => 'integer',
        'nilaiAwal' => 'float',
        'bebanPenyusutan' => 'float',
        'akumulasiPenyusutan' => 'float',
        'nilaiBukuAkhir' => 'float',
        'persenUmur' => 'float',
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
