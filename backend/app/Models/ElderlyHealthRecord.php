<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ElderlyHealthRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'elderly_name',
        'gender',
        'age',
        'rt_number',
        'systolic',
        'diastolic',
        'blood_pressure_status',
        'blood_sugar',
        'cholesterol',
        'uric_acid',
        'weight_kg',
        'waist_circumference_cm',
        'risk_assessment',
        'recommendations',
        'examined_at',
        'officer_id',
    ];

    protected $casts = [
        'examined_at' => 'datetime',
        'blood_sugar' => 'decimal:2',
        'cholesterol' => 'decimal:2',
        'uric_acid' => 'decimal:2',
        'weight_kg' => 'decimal:2',
        'waist_circumference_cm' => 'decimal:2',
        'age' => 'integer',
        'systolic' => 'integer',
        'diastolic' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function officer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'officer_id');
    }

    /**
     * Helper to classify blood pressure based on JNC-7 standard
     */
    public static function classifyBloodPressure(int $systolic, int $diastolic): string
    {
        if ($systolic < 90 || $diastolic < 60) {
            return 'hypotension';
        } elseif ($systolic < 120 && $diastolic < 80) {
            return 'normal';
        } elseif ($systolic <= 139 || $diastolic <= 89) {
            return 'prehypertension';
        } elseif ($systolic <= 159 || $diastolic <= 99) {
            return 'hypertension_stage1';
        } else {
            return 'hypertension_stage2';
        }
    }

    /**
     * Helper to formulate health risk assessment & recommendations
     */
    public static function formulateRiskAssessment(
        int $systolic,
        int $diastolic,
        ?float $bloodSugar,
        ?float $cholesterol,
        ?float $uricAcid,
        string $gender = 'L'
    ): array {
        $bpStatus = self::classifyBloodPressure($systolic, $diastolic);
        $risks = [];
        $recs = [];

        // Evaluasi Tensi
        if (in_array($bpStatus, ['hypertension_stage1', 'hypertension_stage2'])) {
            $risks[] = 'Hipertensi (' . $systolic . '/' . $diastolic . ' mmHg)';
            $recs[] = 'Kurangi asupan garam/asin, kelola stres, dan periksakan rutin ke faskes.';
        } elseif ($bpStatus === 'prehypertension') {
            $risks[] = 'Pre-Hipertensi';
            $recs[] = 'Batasi konsumsi garam dan lakukan jalan pagi teratur.';
        } elseif ($bpStatus === 'hypotension') {
            $risks[] = 'Tekanan Darah Rendah';
            $recs[] = 'Cukupi hidrasi air putih dan istirahat teratur.';
        }

        // Evaluasi Gula Darah Sewaktu (GDS)
        if ($bloodSugar !== null) {
            if ($bloodSugar >= 200) {
                $risks[] = 'Risiko Hiperglikemia/Diabetes (GDS ' . $bloodSugar . ' mg/dL)';
                $recs[] = 'Konsultasi dokter Puskesmas untuk cek GDP/HbA1c dan batasi makanan/minuman manis.';
            } elseif ($bloodSugar >= 140) {
                $risks[] = 'Toleransi Glukosa Terganggu (Waspada Diabetes)';
                $recs[] = 'Kurangi karbohidrat sederhana dan camilan manis.';
            }
        }

        // Evaluasi Kolesterol Total
        if ($cholesterol !== null) {
            if ($cholesterol >= 200) {
                $risks[] = 'Kolesterol Tinggi (' . $cholesterol . ' mg/dL)';
                $recs[] = 'Kurangi makanan berminyak/gorengan dan santan berlebih.';
            }
        }

        // Evaluasi Asam Urat
        if ($uricAcid !== null) {
            $limit = ($gender === 'L') ? 7.0 : 6.0;
            if ($uricAcid > $limit) {
                $risks[] = 'Asam Urat Tinggi (' . $uricAcid . ' mg/dL)';
                $recs[] = 'Hindari konsumsi jeroan, emping, bayam berlebih, dan kacang-kacangan.';
            }
        }

        if (empty($risks)) {
            $riskText = 'Kondisi Kesehatan Baik (Dalam Batas Normal)';
            $recText = 'Pertahankan pola makan bergizi seimbang, senam lansia, dan kontrol rutin Posyandu.';
        } else {
            $riskText = implode(' • ', $risks);
            $recText = implode(' ', $recs);
        }

        return [
            'blood_pressure_status' => $bpStatus,
            'risk_assessment' => $riskText,
            'recommendations' => $recText,
        ];
    }
}
