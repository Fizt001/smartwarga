<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetLoan extends Model
{
    use HasFactory;

    protected $fillable = [
        'asset_id',
        'user_id',
        'quantity',
        'loan_date',
        'return_date',
        'actual_return_date',
        'status',
        'donation_amount',
        'approved_by',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'loan_date' => 'date',
        'return_date' => 'date',
        'actual_return_date' => 'date',
        'donation_amount' => 'decimal:2',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
