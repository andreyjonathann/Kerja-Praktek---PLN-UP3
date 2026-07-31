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
        'kwh_netto',
        'pssd',
        'kwh_jual_309',
        'realisasi_persen',
        'keterangan',
        'created_by'
    ];

    protected $casts = [
        'kwh_netto' => 'float',
        'pssd' => 'float',
        'kwh_jual_309' => 'float',
        'realisasi_persen' => 'float',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
