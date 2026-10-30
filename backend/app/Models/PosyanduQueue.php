<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PosyanduQueue extends Model
{
    use HasFactory;

    protected $fillable = [
        'queue_number',
        'queue_date',
        'category',
        'user_id',
        'rfid_uid',
        'patient_name',
        'patient_age',
        'complaint',
        'status',
        'called_at',
        'completed_at',
        'officer_id',
        'notes',
    ];

    protected $casts = [
        'queue_date' => 'date',
        'called_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function officer()
    {
        return $this->belongsTo(User::class, 'officer_id');
    }
}

