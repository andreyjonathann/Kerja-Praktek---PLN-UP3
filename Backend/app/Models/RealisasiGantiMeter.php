<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RealisasiGantiMeter extends Model
{
    use HasFactory;

    protected $fillable = [
        'up3',
        'tahun',
        'bulan',
        'jumlah_app',
        'jumlah_yantek',
        'total',
        'keterangan',
        'created_by'
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
