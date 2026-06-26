<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MttrRealisasi extends Model
{
    use HasFactory;

    protected $fillable = [
        'up3',
        'tahun',
        'bulan',
        'jenis_aset',
        'jumlah_siaga1_terpenuhi',
        'jumlah_siaga1_total',
        'persen_realisasi',
        'created_by'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
