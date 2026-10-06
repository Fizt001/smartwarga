<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImmunizationRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'child_name',
        'parent_user_id',
        'vaccine_name',
        'target_age_months',
        'scheduled_date',
        'administered_date',
        'status',
        'batch_number',
        'officer_id',
        'notes',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'administered_date' => 'date',
        'target_age_months' => 'integer',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'parent_user_id');
    }

    public function officer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'officer_id');
    }
}
