<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class K3Criterion extends Model
{
    protected $table = 'k3_criteria';

    protected $fillable = ['category_id', 'code', 'name', 'target_description', 'sort_order'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(K3Category::class, 'category_id');
    }

    public function levels(): HasMany
    {
        return $this->hasMany(K3CriterionLevel::class, 'criteria_id')->orderBy('level');
    }

    public function targets(): HasMany
    {
        return $this->hasMany(K3Target::class, 'criteria_id');
    }

    public function assessments(): HasMany
    {
        return $this->hasMany(K3Assessment::class, 'criteria_id');
    }
}
