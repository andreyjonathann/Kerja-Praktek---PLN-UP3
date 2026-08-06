<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TargetGantiMeterHarian extends Model
{
    use HasFactory;

    protected $fillable = [
        'tanggal',
        'target_unit',
        'created_by'
    ];
}
