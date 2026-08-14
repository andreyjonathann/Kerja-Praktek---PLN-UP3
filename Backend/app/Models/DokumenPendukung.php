<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DokumenPendukung extends Model
{
    use HasFactory;

    protected $table = 'dokumen_pendukungs';

    protected $fillable = [
        'pengadaan_id',
        'jenis',
        'urutan_ke',
        'nomor_dokumen',
        'tanggal_dokumen',
        'file_path',
        'uploaded_by'
    ];

    protected function casts(): array
    {
        return [
            'tanggal_dokumen' => 'date:Y-m-d',
        ];
    }

    public function pengadaan(): BelongsTo
    {
        return $this->belongsTo(Pengadaan::class, 'pengadaan_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
