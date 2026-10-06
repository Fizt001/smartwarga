<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PosyanduRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'child_name',
        'parent_user_id',
        'birth_date',
        'gender',
        'age_months',
        'weight_kg',
        'height_cm',
        'head_circumference_cm',
        'kms_status',
        'nutrition_status',
        'vitamin_a',
        'notes',
        'rfid_uid',
        'measured_at',
        'officer_id',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'measured_at' => 'datetime',
        'weight_kg' => 'decimal:2',
        'height_cm' => 'decimal:2',
        'head_circumference_cm' => 'decimal:2',
        'vitamin_a' => 'boolean',
        'age_months' => 'integer',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'parent_user_id');
    }

    public function officer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'officer_id');
    }

    /**
     * Helper to classify KMS status & nutritional status based on WHO child growth charts
     */
    public static function evaluateKms(float $weightKg, float $heightCm, int $ageMonths, string $gender = 'L'): array
    {
        // Standar median berat WHO (terstandarisasi Kemenkes / WHO Child Growth Standards)
        if ($ageMonths <= 12) {
            $medianWeight = 3.3 + ($ageMonths * 0.50); // Usia 12 bln = ~9.3 kg
        } elseif ($ageMonths <= 24) {
            $medianWeight = 9.3 + (($ageMonths - 12) * 0.25); // Usia 24 bln = ~12.3 kg
        } else {
            $medianWeight = 12.3 + (($ageMonths - 24) * 0.17); // Usia 36 bln = ~14.3 kg
        }

        $ratio = $weightKg / max($medianWeight, 1);

        if ($ratio < 0.70) {
            $kmsStatus = 'red'; // Bawah Garis Merah (BGM)
            $nutrition = 'Gizi Buruk / BGM (Perlu Intervensi Segera)';
        } elseif ($ratio < 0.85) {
            $kmsStatus = 'yellow'; // Garis Kuning
            $nutrition = 'Gizi Kurang (Waspada Kurva Melandai)';
        } elseif ($ratio <= 1.25) {
            $kmsStatus = 'green'; // Garis Hijau
            $nutrition = 'Gizi Baik (Normal Sesuai Usia)';
        } else {
            $kmsStatus = 'yellow';
            $nutrition = 'Risiko Gizi Lebih (Overweight)';
        }

        // Cek potensi stunting (Height-for-age standar WHO)
        if ($ageMonths <= 12) {
            $medianHeight = 50 + ($ageMonths * 2.1); // Usia 12 bln = ~75 cm
        } else {
            $medianHeight = 75 + (($ageMonths - 12) * 1.0); // Usia 24 bln = ~87 cm
        }

        if ($heightCm < ($medianHeight * 0.88)) {
            $nutrition .= ' • Indikasi Stunting (Tinggi di bawah kurva)';
        }

        return [
            'kms_status' => $kmsStatus,
            'nutrition_status' => $nutrition,
        ];
    }
}
