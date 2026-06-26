<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class MttrTarget extends Model
{
    use HasFactory;

    protected $fillable = [
        'up3',
        'tahun',
        'target_persen',
        'jumlah_penyulang',
    ];
}
