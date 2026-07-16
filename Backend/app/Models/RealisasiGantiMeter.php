<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RealisasiGantiMeter extends Model
{
    use HasFactory;

    protected $fillable = [
        'up3',
        'tanggal',
        'tahun',
        'bulan',
        'jumlah_app',
        'jumlah_yantek',
        'total',
        'keterangan',
        'created_by'
    ];
    protected $casts = [
        'tanggal' => 'date:Y-m-d',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
