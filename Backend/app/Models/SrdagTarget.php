<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SrdagTarget extends Model
{
    use HasFactory;

    protected $fillable = [
        'up3',
        'tahun',
        'target_rate',
    ];
}
