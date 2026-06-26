<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MvodRealisasi extends Model
{
    use HasFactory;

    protected $fillable = [
        'up3',
        'tahun',
        'bulan',
        'tipe_rct',
        'total_lama_padam_jam',
        'kali_padam',
        'total_lama_padam_menit',
        'rata_rct_menit',
        'created_by'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
