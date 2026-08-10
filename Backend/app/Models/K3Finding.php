<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class K3Finding extends Model
{
    use HasFactory;

    protected $fillable = [
        'judul',
        'deskripsi',
        'jenis',
        'pic_name',
        'due_date',
        'status',
        'unit',
        'foto_path',
        'foto_name',
        'created_by',
    ];

    protected $casts = [
        'due_date' => 'date:Y-m-d',
    ];

    public function progress()
    {
        return $this->hasMany(K3FindingProgress::class)->orderBy('created_at', 'asc');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
