<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KategoriItem extends Model
{
    protected $table = 'kategori_items';

    protected $fillable = [
        'kategoriItemCode',
        'kategoriItemName',
        'umurEkonomisTahun',
        'tarifPenyusutanPersen',
    ];

    protected $casts = [
        'umurEkonomisTahun' => 'integer',
        'tarifPenyusutanPersen' => 'float',
    ];

    public function toArray()
    {
        $array = parent::toArray();
        $array['_id'] = $this->id;

        return $array;
    }

    public function items()
    {
        return $this->hasMany(Item::class, 'kategori_item_id');
    }
}
