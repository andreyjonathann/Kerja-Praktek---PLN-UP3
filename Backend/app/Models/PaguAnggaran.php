<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaguAnggaran extends Model
{
    use HasFactory;

    protected $table = 'pagu_anggarans';

    protected $fillable = [
        'tahun',
        'skko_skki',
        'klasifikasi',
        'jenis_transaksi',
        'nominal',
        'keterangan',
        'created_by',
    ];

    protected $casts = [
        'tahun' => 'integer',
        'nominal' => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
