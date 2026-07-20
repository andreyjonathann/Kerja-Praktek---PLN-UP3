<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RealisasiSusutDistribusi extends Model
{
    use HasFactory;

    protected $table = 'realisasi_susut_distribusis';

    protected $fillable = [
        'up3',
        'tahun',
        'bulan',
        'kwh_siap_jual',
        'kwh_jual',
        'realisasi_persen',
        'keterangan',
        'created_by'
    ];

    protected $casts = [
        'kwh_siap_jual' => 'float',
        'kwh_jual' => 'float',
        'realisasi_persen' => 'float',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
