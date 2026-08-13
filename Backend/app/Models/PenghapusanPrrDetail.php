<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PenghapusanPrrDetail extends Model
{
    use HasFactory;

    protected $table = 'penghapusan_prr_details';

    protected $fillable = [
        'tahun',
        'bulan',
        'tahap',
        'no_surat',
        'jumlah_pelanggan',
        'nominal',
        'file_surat_path',
        'created_by',
    ];

    protected $appends = [
        'file_surat_url',
    ];

    protected function casts(): array
    {
        return [
            'tahun' => 'integer',
            'bulan' => 'integer',
            'jumlah_pelanggan' => 'integer',
            'nominal' => 'double',
        ];
    }

    public function getFileSuratUrlAttribute()
    {
        return $this->file_surat_path ? asset('storage/' . $this->file_surat_path) : null;
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
