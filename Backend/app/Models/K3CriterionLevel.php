<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class K3CriterionLevel extends Model
{
    protected $table = 'k3_criteria_levels';

    protected $fillable = ['criteria_id', 'level', 'description'];

    public function criterion(): BelongsTo
    {
        return $this->belongsTo(K3Criterion::class, 'criteria_id');
    }
}
