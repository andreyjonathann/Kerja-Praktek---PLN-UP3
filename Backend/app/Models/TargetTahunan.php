<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TargetTahunan extends Model
{
    use HasFactory;

    protected $table = 'target_tahunan';

    protected $fillable = [
        'bidang',
        'indikator',
        'satuan',
        'polaritas',
        'bobot',
        'target',
        'tahun'
    ];

    protected $casts = [
        'target' => 'float'
    ];
}
