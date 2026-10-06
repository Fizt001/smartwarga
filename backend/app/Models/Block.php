<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Block extends Model
{
    use HasFactory;

    protected $fillable = [
        'rt_number',
        'block_label',
        'capacity',
    ];

    public function houses(): HasMany
    {
        return $this->hasMany(House::class, 'block', 'block_label')
                    ->where('rt_number', $this->rt_number);
    }
}
