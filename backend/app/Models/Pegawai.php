<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pegawai extends Model
{
    use HasFactory;

    protected $table = 'pegawais';

    protected $fillable = [
        'nip',
        'nama',
        'jabatan',
        'unit_kerja',
        'no_hp',
        'email',
        'status',
        'keterangan',
    ];
}
