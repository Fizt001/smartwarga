<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class RukamReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'reported_by',
        'deceased_name',
        'deceased_nik',
        'deceased_address',
        'relation',
        'date_of_death',
        'time_of_death',
        'cause_of_death',
        'burial_location',
        'burial_datetime',
        'death_certificate_path',
        'needs_ambulance',
        'needs_tent_and_chairs',
        'notes',
        'status',
        'verified_by',
        'verified_at',
        'rejection_reason',
        'disbursement_amount',
        'disbursed_by',
        'disbursed_at',
    ];

    protected $casts = [
        'date_of_death' => 'date',
        'burial_datetime' => 'datetime',
        'verified_at' => 'datetime',
        'disbursed_at' => 'datetime',
        'needs_ambulance' => 'boolean',
        'needs_tent_and_chairs' => 'boolean',
        'disbursement_amount' => 'decimal:2',
    ];

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function disburser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'disbursed_by');
    }

    public function ambulanceBooking(): HasOne
    {
        return $this->hasOne(AmbulanceBooking::class);
    }
}
