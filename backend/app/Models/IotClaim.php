<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IotClaim extends Model
{
    use HasFactory;

    protected $fillable = [
        'duty_area',
        'claimed_by',
        'claimed_by_name',
        'claimed_by_role',
        'wifi_ssid',
        'device_token',
        'device_ip',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'claimed_by');
    }
}
