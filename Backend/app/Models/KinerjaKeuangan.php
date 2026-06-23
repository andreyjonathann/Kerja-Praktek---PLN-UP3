<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KinerjaKeuangan extends Model
{
    use HasFactory;

    protected $table = 'kinerja_keuangan';

    protected $fillable = [
        'periode_id',
        'data_realisasi',
        'nko_score'
    ];

    protected function casts(): array
    {
        return [
            'data_realisasi' => 'array',
        ];
    }

    public function periode()
    {
        return $this->belongsTo(Periode::class);
    }
}