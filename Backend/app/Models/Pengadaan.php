<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pengadaan extends Model
{
    use HasFactory;

    protected $table = 'pengadaans';

    protected $fillable = [
        'status',
        'direksi_pekerjaan',
        'uraian_pekerjaan',
        'no_pr',
        'pt_pelaksana',
        'no_kontrak',
        'tgl_awal',
        'tgl_akhir',
        'rp_kontrak',
        'rab',
        'no_nd_bidang',
        'skko_skki',
        'jenis_kontrak',
        'klasifikasi',
        'file_kontrak',
        'file_kontrak_2',
        'created_by'
    ];

    protected $appends = [
        'file_kontrak_url',
        'file_kontrak_2_url'
    ];

    protected $casts = [
        'tgl_awal' => 'date',
        'tgl_akhir' => 'date',
        'rp_kontrak' => 'float',
        'rab' => 'float',
    ];

    public function getFileKontrakUrlAttribute()
    {
        if ($this->file_kontrak) {
            return asset('storage/' . $this->file_kontrak);
        }
        return null;
    }

    public function getFileKontrak2UrlAttribute()
    {
        if ($this->file_kontrak_2) {
            return asset('storage/' . $this->file_kontrak_2);
        }
        return null;
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
