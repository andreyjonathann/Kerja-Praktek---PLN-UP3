<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DetailGangguanTmLebih5Mnt extends Model
{
    use HasFactory;

    protected $fillable = [
        'up3',
        'bulan',
        'tahun',
        'jumlah_gangguan',
        'penyebab',
        'nama_penyulang'
    ];
}
