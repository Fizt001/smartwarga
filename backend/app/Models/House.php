<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class House extends Model
{
    use HasFactory;

    protected $fillable = [
        'house_code',
        'rt_number',
        'block',
        'number',
        'full_address',
        'is_occupied',
        'head_of_family_id',
    ];

    protected $casts = [
        'is_occupied' => 'boolean',
        'number' => 'integer',
    ];

    /**
     * KK Utama (Penanggung Jawab Rumah)
     */
    public function headOfFamily(): BelongsTo
    {
        return $this->belongsTo(User::class, 'head_of_family_id');
    }

    /**
     * Seluruh penghuni yang berdomisili di rumah ini
     */
    public function residents(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * KK Pendukung / Tambahan di rumah ini
     */
    public function kkPendukung(): HasMany
    {
        return $this->hasMany(User::class)->where('kk_type', 'kk_pendukung');
    }

    /**
     * Tagihan IPL yang dibebankan ke rumah ini
     */
    public function billings(): HasMany
    {
        return $this->hasMany(IplBilling::class);
    }
}
