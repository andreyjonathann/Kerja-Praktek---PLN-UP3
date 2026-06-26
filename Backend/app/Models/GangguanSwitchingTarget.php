<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GangguanSwitchingTarget extends Model
{
    protected $table = 'gangguan_switching_targets';

    protected $fillable = [
        'up3',
        'tahun',
        'target_switching_tahunan',
        'target_trafo_tahunan',
    ];
}
