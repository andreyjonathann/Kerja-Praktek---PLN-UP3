<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Division extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
    ];

    /**
     * Get the KPI indicators for this division.
     */
    public function kpiIndicators(): HasMany
    {
        return $this->hasMany(KpiIndicator::class);
    }
}
