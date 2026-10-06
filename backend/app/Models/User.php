<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'rt_number',
        'house_id',
        'rfid_uid',
        'status',
        'phone',
        'avatar',
        'kk_type',
        'no_kk',
        'nik',
        'birth_place',
        'birth_date',
        'gender',
        'religion',
        'occupation',
        'marital_status',
        'blood_type',
        'relationship',
        'is_head_of_house',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'birth_date' => 'date',
            'is_head_of_house' => 'boolean',
        ];
    }

    public function isKkUtama(): bool
    {
        return $this->kk_type === 'kk_utama' || $this->is_head_of_house;
    }

    public function isKkPendukung(): bool
    {
        return $this->kk_type === 'kk_pendukung';
    }

    // Role check helpers
    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    public function isRw(): bool
    {
        return $this->role === 'rw' || $this->isSuperAdmin();
    }

    public function isRt(): bool
    {
        return $this->role === 'rt';
    }

    public function isBendahara(): bool
    {
        return $this->role === 'bendahara';
    }

    public function isSekretaris(): bool
    {
        return $this->role === 'sekretaris';
    }

    public function isWarga(): bool
    {
        return $this->role === 'warga';
    }

    public function isPengurus(): bool
    {
        return in_array($this->role, ['super_admin', 'rw', 'rt', 'bendahara', 'sekretaris']);
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    // Relationships
    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    public function wallet(): HasOne
    {
        return $this->hasOne(Wallet::class);
    }

    public function iplBillings(): HasMany
    {
        return $this->hasMany(IplBilling::class);
    }

    public function letters(): HasMany
    {
        return $this->hasMany(Letter::class);
    }

    public function complaints(): HasMany
    {
        return $this->hasMany(Complaint::class);
    }

    public function umkmProducts(): HasMany
    {
        return $this->hasMany(UmkmProduct::class);
    }

    public function koperasiLoans(): HasMany
    {
        return $this->hasMany(KoperasiLoan::class);
    }

    public function assetLoans(): HasMany
    {
        return $this->hasMany(AssetLoan::class);
    }

    public function wasteTransactions(): HasMany
    {
        return $this->hasMany(WasteBankTransaction::class);
    }

    public function posyanduRecords(): HasMany
    {
        return $this->hasMany(PosyanduRecord::class, 'parent_user_id');
    }

    public function immunizationRecords(): HasMany
    {
        return $this->hasMany(ImmunizationRecord::class, 'parent_user_id');
    }

    public function elderlyHealthRecords(): HasMany
    {
        return $this->hasMany(ElderlyHealthRecord::class, 'user_id');
    }

    public function rukamReports(): HasMany
    {
        return $this->hasMany(RukamReport::class, 'reported_by');
    }

    public function ambulanceBookings(): HasMany
    {
        return $this->hasMany(AmbulanceBooking::class, 'user_id');
    }
}
