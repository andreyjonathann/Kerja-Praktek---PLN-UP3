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
        'tahun',
        'target_jan',
        'target_feb',
        'target_mar',
        'target_apr',
        'target_mei',
        'target_jun',
        'target_jul',
        'target_agu',
        'target_sep',
        'target_okt',
        'target_nov',
        'target_des',
    ];

    protected $casts = [
        'target' => 'float',
        'target_jan' => 'float',
        'target_feb' => 'float',
        'target_mar' => 'float',
        'target_apr' => 'float',
        'target_mei' => 'float',
        'target_jun' => 'float',
        'target_jul' => 'float',
        'target_agu' => 'float',
        'target_sep' => 'float',
        'target_okt' => 'float',
        'target_nov' => 'float',
        'target_des' => 'float',
    ];
}
