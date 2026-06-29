<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KinerjaJaringan extends Model
{
    use HasFactory;

    protected $table = 'kinerja_jaringan';

    protected $fillable = [
        'periode_id',
        'saidi_har', 'saidi_penyulang', 'saidi_gardu', 'saidi_jtr', 'saidi_sr_app', 'saidi_bencana_alam', 'saidi_sistem_transmisi', 'saidi_total',
        'saifi_har', 'saifi_penyulang', 'saifi_gardu', 'saifi_jtr', 'saifi_sr_app', 'saifi_bencana_alam', 'saifi_sistem_transmisi', 'saifi_total',
        'caidi', 'nko_score'
    ];

    public function periode()
    {
        return $this->belongsTo(Periode::class);
    }
}

