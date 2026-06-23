<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EnsBulanan extends Model
{
    use HasFactory;
    protected $table = 'ens_bulanan';
    protected $guarded = [];

    public function periode()
    {
        return $this->belongsTo(Periode::class);
    }
}
