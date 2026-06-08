<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyKpiInput extends Model
{
    use HasFactory;

    protected $fillable = [
        'kpi_indicator_id',
        'date',
        'realization_value',
        'pic_user_id',
    ];

    protected $casts = [
        'realization_value' => 'float',
        'date' => 'date',
    ];

    /**
     * Get the KPI indicator this input belongs to.
     */
    public function kpiIndicator(): BelongsTo
    {
        return $this->belongsTo(KpiIndicator::class);
    }

    /**
     * Get the PIC user who entered this data.
     */
    public function picUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pic_user_id');
    }
}
