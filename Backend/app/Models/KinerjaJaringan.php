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
        'saidi_distribusi_padam_tidak_terencana', 'saidi_distribusi_padam_terencana', 'saidi_distribusi_bencana_alam', 'saidi_transmisi', 'saidi_pembangkit', 'saidi_total',
        'saifi_distribusi_padam_tidak_terencana', 'saifi_distribusi_padam_terencana', 'saifi_distribusi_bencana_alam', 'saifi_transmisi', 'saifi_pembangkit', 'saifi_total',
        'caidi', 'nko_score',
        'jml_rating_negatif', 'jml_wo_pln_mobile', 'persen_rating_negatif',
        'ggn_tm_lebih_5_mnt', 'ggn_tm_kurang_5_mnt', 'ggn_switching'
    ];

    protected $casts = [
        'saidi_distribusi_padam_tidak_terencana' => 'float', 'saidi_distribusi_padam_terencana' => 'float', 'saidi_distribusi_bencana_alam' => 'float', 'saidi_transmisi' => 'float', 'saidi_pembangkit' => 'float', 'saidi_total' => 'float',
        'saifi_distribusi_padam_tidak_terencana' => 'float', 'saifi_distribusi_padam_terencana' => 'float', 'saifi_distribusi_bencana_alam' => 'float', 'saifi_transmisi' => 'float', 'saifi_pembangkit' => 'float', 'saifi_total' => 'float',
        'caidi' => 'float', 'nko_score' => 'float',
        'jml_rating_negatif' => 'integer', 'jml_wo_pln_mobile' => 'integer', 'persen_rating_negatif' => 'float',
        'ggn_tm_lebih_5_mnt' => 'integer', 'ggn_tm_kurang_5_mnt' => 'integer', 'ggn_switching' => 'integer'
    ];

    public function periode()
    {
        return $this->belongsTo(Periode::class);
    }
}

