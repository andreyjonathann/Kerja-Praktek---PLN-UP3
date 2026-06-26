<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GangguanSwitching extends Model
{
    protected $table = 'gangguan_switching';

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
}
