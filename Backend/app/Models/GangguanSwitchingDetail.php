<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GangguanSwitchingDetail extends Model
{
    use HasFactory;
    
    protected $table = 'gangguan_switching_details';
    protected $fillable = ['gangguan_switching_id', 'merek', 'tahun_alat', 'nomor_seri'];

    public function gangguanSwitching()
    {
        return $this->belongsTo(GangguanSwitching::class);
    }
}
