<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SrdagRealisasi extends Model
{
    use HasFactory;

    protected $fillable = [
        'up3',
        'tahun',
        'bulan',
        'jumlah_dispatch_berhasil',
        'jumlah_total_gangguan',
        'success_rate',
        'created_by'
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
