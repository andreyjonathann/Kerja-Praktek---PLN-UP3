<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GangguanTrafo extends Model
{
    protected $table = 'gangguan_trafo';

    protected $fillable = [
        'up3',
        'tahun',
        'bulan',
        'jumlah_gangguan',
        'created_by',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function details()
    {
        return $this->hasMany(GangguanTrafoDetail::class, 'gangguan_trafo_id');
    }
}
