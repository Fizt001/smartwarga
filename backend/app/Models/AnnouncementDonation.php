<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnnouncementDonation extends Model
{
    use HasFactory;

    protected $fillable = [
        'announcement_id',
        'user_id',
        'amount',
        'payment_proof',
        'status',
        'verified_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function announcement(): BelongsTo
    {
        return $this->belongsTo(Announcement::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
