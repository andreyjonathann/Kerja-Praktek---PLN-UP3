<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class NkoParameter extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'nko_parameters';

    protected $fillable = [
        'parent_id',
        'nama',
        'polaritas',
        'satuan',
        'bobot',
        'urutan',
        'is_active'
    ];

    protected $casts = [
        'bobot' => 'float',
        'urutan' => 'integer',
        'is_active' => 'boolean'
    ];

    // Get parent parameter
    public function parent()
    {
        return $this->belongsTo(NkoParameter::class, 'parent_id');
    }

    // Get sub-parameters
    public function children()
    {
        return $this->hasMany(NkoParameter::class, 'parent_id')->orderBy('urutan');
    }

    // Get realizations
    public function realizations()
    {
        return $this->hasMany(NkoRealization::class, 'parameter_id');
    }
}
