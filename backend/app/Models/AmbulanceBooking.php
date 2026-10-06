<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AmbulanceBooking extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_code',
        'user_id',
        'ambulance_id',
        'rukam_report_id',
        'patient_name',
        'service_type',
        'urgency_level',
        'pickup_address',
        'destination_address',
        'pickup_time',
        'notes',
        'driver_name',
        'driver_phone',
        'status',
        'dispatched_at',
        'completed_at',
        'handled_by',
    ];

    protected $casts = [
        'pickup_time' => 'datetime',
        'dispatched_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function ambulance(): BelongsTo
    {
        return $this->belongsTo(Ambulance::class);
    }

    public function rukamReport(): BelongsTo
    {
        return $this->belongsTo(RukamReport::class);
    }

    public function handler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by');
    }
}
