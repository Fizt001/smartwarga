<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ambulance extends Model
{
    use HasFactory;

    protected $fillable = [
        'vehicle_number',
        'name',
        'type',
        'status',
        'driver_name',
        'driver_phone',
        'equipment',
        'notes',
    ];

    protected $casts = [
        'equipment' => 'array',
    ];

    public function bookings(): HasMany
    {
        return $this->hasMany(AmbulanceBooking::class);
    }
}
