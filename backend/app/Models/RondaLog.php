<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RondaLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'schedule_id',
        'user_id',
        'rfid_uid',
        'post_id',
        'tapped_at',
        'status',
    ];

    protected $casts = [
        'tapped_at' => 'datetime',
    ];

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(RondaSchedule::class, 'schedule_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
