<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GangguanBulanan extends Model
{
    use HasFactory;
    protected $table = 'gangguan_bulanan';
    protected $guarded = [];

    public function periode()
    {
        return $this->belongsTo(Periode::class);
    }
}
