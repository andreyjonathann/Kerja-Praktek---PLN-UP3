<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RealisasiPembayaran extends Model
{
    use HasFactory;

    protected $table = 'realisasi_pembayarans';

    protected $fillable = [
        'pengadaan_id',
        'jenis',
        'termin_ke',
        'nilai_realisasi',
        'tanggal_bayar',
        'bulan_rencana_bayar',
        'keterangan_kendala',
        'status',
        'input_by'
    ];

    protected function casts(): array
    {
        return [
            'nilai_realisasi' => 'float',
            'tanggal_bayar' => 'date:Y-m-d',
        ];
    }

    public function pengadaan(): BelongsTo
    {
        return $this->belongsTo(Pengadaan::class, 'pengadaan_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'input_by');
    }
}
