<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class K3Assessment extends Model
{
    protected $fillable = [
        'criteria_id', 'period', 'actual_level', 'notes',
        'status', 'catatan_revisor', 'submitted_by', 'approved_by',
        'submitted_at', 'approved_at',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'approved_at'  => 'datetime',
    ];

    public function criterion(): BelongsTo
    {
        return $this->belongsTo(K3Criterion::class, 'criteria_id');
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
