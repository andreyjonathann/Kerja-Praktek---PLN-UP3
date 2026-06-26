<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RptGangguan extends Model
{
    use HasFactory;

    protected $fillable = [
        'up3',
        'tahun',
        'bulan',
        'total_durasi_menit',
        'jumlah_gangguan',
        'rata_rata_rpt',
        'created_by'
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
