<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class K3FindingProgress extends Model
{
    protected $fillable = [
        'k3_finding_id',
        'text',
        'author',
        'attachment_path',
        'attachment_name',
    ];

    public function finding()
    {
        return $this->belongsTo(K3Finding::class, 'k3_finding_id');
    }
}
