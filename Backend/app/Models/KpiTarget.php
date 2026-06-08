<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KpiTarget extends Model
{
    use HasFactory;

    protected $fillable = [
        'kpi_indicator_id',
        'year',
        'month',
        'target_value',
    ];

    protected $casts = [
        'target_value' => 'float',
        'year' => 'integer',
        'month' => 'integer',
    ];

    /**
     * Get the KPI indicator that owns this target.
     */
    public function kpiIndicator(): BelongsTo
    {
        return $this->belongsTo(KpiIndicator::class);
    }
}
