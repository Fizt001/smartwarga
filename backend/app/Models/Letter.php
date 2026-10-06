<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Letter extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'purpose',
        'status',
        'rt_approved_by',
        'rt_approved_at',
        'rw_approved_by',
        'rw_approved_at',
        'rejected_reason',
        'pdf_path',
        'notes',
    ];

    protected $casts = [
        'rt_approved_at' => 'datetime',
        'rw_approved_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function rtApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rt_approved_by');
    }

    public function rwApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rw_approved_by');
    }
}
