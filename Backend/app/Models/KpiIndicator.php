<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KpiIndicator extends Model
{
    use HasFactory;

    protected $fillable = [
        'division_id',
        'code',
        'name',
        'unit',
        'aggregation_method',
    ];

    /**
     * Get the division that owns this KPI indicator.
     */
    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    /**
     * Get the targets configured for this KPI indicator.
     */
    public function kpiTargets(): HasMany
    {
        return $this->hasMany(KpiTarget::class);
    }

    /**
     * Get the daily inputs for this KPI indicator.
     */
    public function dailyKpiInputs(): HasMany
    {
        return $this->hasMany(DailyKpiInput::class);
    }
}
