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
        'caidi', 'nko_score',
        'jml_rating_negatif', 'jml_wo_pln_mobile', 'persen_rating_negatif',
        'ggn_tm_lebih_5_mnt', 'ggn_tm_kurang_5_mnt', 'ggn_switching'
    ];

    protected $casts = [
        'saidi_har' => 'float', 'saidi_penyulang' => 'float', 'saidi_gardu' => 'float', 'saidi_jtr' => 'float', 'saidi_sr_app' => 'float', 'saidi_bencana_alam' => 'float', 'saidi_sistem_transmisi' => 'float', 'saidi_total' => 'float',
        'saifi_har' => 'float', 'saifi_penyulang' => 'float', 'saifi_gardu' => 'float', 'saifi_jtr' => 'float', 'saifi_sr_app' => 'float', 'saifi_bencana_alam' => 'float', 'saifi_sistem_transmisi' => 'float', 'saifi_total' => 'float',
        'caidi' => 'float', 'nko_score' => 'float',
        'jml_rating_negatif' => 'integer', 'jml_wo_pln_mobile' => 'integer', 'persen_rating_negatif' => 'float',
        'ggn_tm_lebih_5_mnt' => 'integer', 'ggn_tm_kurang_5_mnt' => 'integer', 'ggn_switching' => 'integer'
    ];

    public function periode()
    {
        return $this->belongsTo(Periode::class);
    }
}

