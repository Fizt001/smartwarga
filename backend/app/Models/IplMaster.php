<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class IplMaster extends Model
{
    use HasFactory;

    protected $fillable = [
        'rt_number',
        'period_month',
        'period_year',
        'base_ipl_amount',
        'rw_contribution_amount',
        'total_amount',
        'created_by',
    ];

    protected $casts = [
        'base_ipl_amount' => 'decimal:2',
        'rw_contribution_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'period_month' => 'integer',
        'period_year' => 'integer',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function billings(): HasMany
    {
        return $this->hasMany(IplBilling::class);
    }
}
