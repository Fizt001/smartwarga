<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class IotDevice extends Model
{
    use HasFactory;

    protected $fillable = [
        'device_key',
        'device_type',
        'location',
        'last_ping',
        'is_active',
    ];

    protected $casts = [
        'last_ping' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function emergencyLogs(): HasMany
    {
        return $this->hasMany(IotEmergencyLog::class, 'device_id');
    }
}
