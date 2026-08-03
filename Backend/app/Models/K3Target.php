<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class K3Target extends Model
{
    protected $fillable = ['criteria_id', 'period', 'target_level', 'created_by'];

    public function criterion(): BelongsTo
    {
        return $this->belongsTo(K3Criterion::class, 'criteria_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
