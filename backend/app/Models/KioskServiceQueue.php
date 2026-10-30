<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KioskServiceQueue extends Model
{
    use HasFactory;

    protected $fillable = [
        'queue_number',
        'queue_date',
        'rfid_uid',
        'user_id',
        'citizen_name',
        'status',
        'service_type',
        'service_notes',
        'tapped_at',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'queue_date' => 'date',
        'tapped_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

