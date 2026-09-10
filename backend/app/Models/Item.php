<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    protected $table = 'items';

    protected $fillable = [
        'kategori_item_id',
        'itemCode',
        'nup',
        'kode_bmn',
        'itemName',
        'merk_tipe',
        'nomor_seri',
        'tahunPerolehan',
        'nilaiPerolehan',
        'kondisi',
        'status_penggunaan',
        'lokasi_ruangan',
        'unit_kerja',
        'penanggung_jawab',
    ];

    protected $casts = [
        'tahunPerolehan' => 'integer',
        'nilaiPerolehan' => 'float',
    ];

    public function toArray()
    {
        $array = parent::toArray();
        $array['_id'] = $this->id;
        if (isset($array['kategori_item'])) {
            $array['kategoriItem'] = $array['kategori_item'];
        }

        return $array;
    }

    public function kategoriItem()
    {
        return $this->belongsTo(KategoriItem::class, 'kategori_item_id');
    }

    public function penyusutans()
    {
        return $this->hasMany(Penyusutan::class, 'item_id');
    }

    public function renovasis()
    {
        return $this->hasMany(Renovasi::class, 'item_id');
    }

    public function mutasiLokasis()
    {
        return $this->hasMany(MutasiLokasi::class, 'item_id');
    }

    public function peminjamanWasriks()
    {
        return $this->hasMany(PeminjamanWasrik::class, 'item_id');
    }

    public function pengajuanServises()
    {
        return $this->hasMany(PengajuanServis::class, 'item_id');
    }
}
