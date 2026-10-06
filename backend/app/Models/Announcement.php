<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Announcement extends Model
{
    use HasFactory;

    protected $fillable = [
        'created_by',
        'scope',
        'title',
        'content',
        'type',
        'event_date',
        'budget_amount',
        'budget_source',
        'budget_status',
        'budget_approved_by',
        'budget_notes',
        'actual_spent',
        'extra_fee_per_family',
        'donation_target',
        'financial_report_notes',
        'allow_rsvp',
        'allow_donation',
        'is_active',
    ];

    protected $casts = [
        'event_date' => 'datetime',
        'budget_amount' => 'decimal:2',
        'actual_spent' => 'decimal:2',
        'extra_fee_per_family' => 'decimal:2',
        'donation_target' => 'decimal:2',
        'allow_rsvp' => 'boolean',
        'allow_donation' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function budgetApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'budget_approved_by');
    }

    public function rsvps(): HasMany
    {
        return $this->hasMany(AnnouncementRsvp::class);
    }

    public function donations(): HasMany
    {
        return $this->hasMany(AnnouncementDonation::class);
    }
}
