<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RekapNko extends Model
{
    use HasFactory;

    protected $table = 'rekap_nko';

    protected $fillable = [
        'periode_id',
        'score_aset', 'score_jaringan', 'score_transaksi_energi', 'score_niaga', 'score_pemasaran', 'score_keuangan', 'total_nko'
    ];

    public function periode()
    {
        return $this->belongsTo(Periode::class);
    }
}