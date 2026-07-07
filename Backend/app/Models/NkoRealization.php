<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class NkoRealization extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'nko_realizations';

    protected $fillable = [
        'parameter_id',
        'tahun',
        'bulan',
        'target_tahunan',
        'target_bulanan',
        'realisasi',
        'pencapaian',
        'nilai',
        'keterangan',
        'pic_id'
    ];

    protected $casts = [
        'parameter_id' => 'integer',
        'tahun' => 'integer',
        'bulan' => 'integer',
        'target_tahunan' => 'float',
        'target_bulanan' => 'float',
        'realisasi' => 'float',
        'pencapaian' => 'float',
        'nilai' => 'float'
    ];

    // Get associated parameter
    public function parameter()
    {
        return $this->belongsTo(NkoParameter::class, 'parameter_id');
    }

    // Get associated PIC
    public function pic()
    {
        return $this->belongsTo(User::class, 'pic_id');
    }
}
