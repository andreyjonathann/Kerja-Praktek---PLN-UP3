<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class K3Activity extends Model
{
    protected $table = 'k3_activities';

    protected $fillable = [
        'jenis', 'judul', 'tanggal', 'lokasi',
        'peserta', 'keterangan', 'status', 'created_by',
    ];

    protected $casts = [
        'tanggal' => 'date',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
