<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RealisasiP2tl extends Model
{
    use HasFactory;

    protected $table = 'realisasi_p2tl';

    protected $fillable = [
        'up3',
        'tahun',
        'bulan',
        'realisasi_kwh',
        'keterangan',
        'created_by',
    ];

    protected $casts = [
        'realisasi_kwh' => 'float',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
