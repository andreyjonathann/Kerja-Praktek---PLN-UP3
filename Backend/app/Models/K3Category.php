<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class K3Category extends Model
{
    protected $fillable = ['code', 'name', 'short_name', 'color', 'icon', 'sort_order'];

    public function criteria(): HasMany
    {
        return $this->hasMany(K3Criterion::class, 'category_id')->orderBy('sort_order');
    }
}
