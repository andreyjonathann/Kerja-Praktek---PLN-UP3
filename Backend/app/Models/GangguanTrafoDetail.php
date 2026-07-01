<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GangguanTrafoDetail extends Model
{
    use HasFactory;
    
    protected $table = 'gangguan_trafo_details';
    protected $fillable = ['gangguan_trafo_id', 'merek', 'tahun_alat', 'nomor_seri'];

    public function gangguanTrafo()
    {
        return $this->belongsTo(GangguanTrafo::class);
    }
}
