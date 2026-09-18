<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmailOtp extends Model
{
    use HasFactory;

    protected $table = 'email_otps';

    protected $fillable = [
        'email',
        'otp_code',
        'action',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];
}
