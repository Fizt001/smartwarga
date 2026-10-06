<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RondaSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'shift',
        'assigned_users',
        'rt_number',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'date' => 'date',
        'assigned_users' => 'array',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(RondaLog::class, 'schedule_id');
    }
}
