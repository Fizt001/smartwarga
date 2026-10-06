<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KoperasiLoan extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'amount',
        'tenor_months',
        'monthly_installment',
        'purpose',
        'status',
        'approved_by',
        'disbursed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'monthly_installment' => 'decimal:2',
        'disbursed_at' => 'datetime',
        'tenor_months' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
