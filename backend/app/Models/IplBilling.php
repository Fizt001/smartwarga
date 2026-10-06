<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IplBilling extends Model
{
    use HasFactory;

    protected $fillable = [
        'ipl_master_id',
        'user_id',
        'house_id',
        'amount',
        'status',
        'payment_method',
        'payment_proof_path',
        'verified_by',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    public function master(): BelongsTo
    {
        return $this->belongsTo(IplMaster::class, 'ipl_master_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
