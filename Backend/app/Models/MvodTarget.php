<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MvodTarget extends Model
{
    use HasFactory;

    protected $fillable = [
        'up3',
        'tahun',
        'sla_gi_menit',
        'sla_jtm_menit',
        'sla_gd_menit',
    ];
}
