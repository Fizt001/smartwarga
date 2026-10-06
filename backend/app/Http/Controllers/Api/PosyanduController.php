<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ElderlyHealthRecord;
use App\Models\ImmunizationRecord;
use App\Models\PosyanduRecord;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PosyanduController extends Controller
{
    /**
     * List Posyandu KMS Balita Records
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = PosyanduRecord::with(['parent.house', 'officer']);

        if ($user->role === 'warga') {
            $query->where('parent_user_id', $user->id);
        } else {
            if ($request->filled('rt_number')) {
                $query->whereHas('parent', function ($q) use ($request) {
                    $q->where('rt_number', $request->rt_number);
                });
            }
        }

        if ($request->filled('kms_status')) {
            $query->where('kms_status', $request->kms_status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('child_name', 'like', "%{$search}%")
                  ->orWhere('nutrition_status', 'like', "%{$search}%");
            });
        }

        $records = $query->latest('measured_at')->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $records,
        ]);
    }

    /**
     * Store KMS Balita Growth Record
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'child_name' => 'required|string|max:100',
            'parent_user_id' => 'nullable|exists:users,id',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|in:L,P',
            'age_months' => 'nullable|integer|min:0|max:72',
            'weight_kg' => 'required|numeric|min:1|max:50',
            'height_cm' => 'required|numeric|min:30|max:150',
            'head_circumference_cm' => 'nullable|numeric|min:20|max:70',
            'kms_status' => 'nullable|in:green,yellow,red',
            'nutrition_status' => 'nullable|string|max:150',
            'vitamin_a' => 'boolean',
            'notes' => 'nullable|string|max:500',
            'rfid_uid' => 'nullable|string|max:50',
        ]);

        $gender = $validated['gender'] ?? 'L';

        // Auto compute age in months if birth_date provided and age_months empty
        $ageMonths = $validated['age_months'] ?? null;
        if ($ageMonths === null && !empty($validated['birth_date'])) {
            $birth = Carbon::parse($validated['birth_date']);
            $ageMonths = max(0, $birth->diffInMonths(now()));
        }
        $ageMonths = $ageMonths ?? 12;

        // Auto evaluate KMS & nutrition if not explicitly given
        $kmsStatus = $validated['kms_status'] ?? null;
        $nutritionStatus = $validated['nutrition_status'] ?? null;

        if (!$kmsStatus || !$nutritionStatus) {
            $eval = PosyanduRecord::evaluateKms(
                (float) $validated['weight_kg'],
                (float) $validated['height_cm'],
                (int) $ageMonths,
                $gender
            );
            $kmsStatus = $kmsStatus ?: $eval['kms_status'];
            $nutritionStatus = $nutritionStatus ?: $eval['nutrition_status'];
        }

        $record = PosyanduRecord::create([
            'child_name' => $validated['child_name'],
            'parent_user_id' => $validated['parent_user_id'] ?? ($request->user()->role === 'warga' ? $request->user()->id : null),
            'birth_date' => $validated['birth_date'] ?? null,
            'gender' => $gender,
            'age_months' => $ageMonths,
            'weight_kg' => $validated['weight_kg'],
            'height_cm' => $validated['height_cm'],
            'head_circumference_cm' => $validated['head_circumference_cm'] ?? null,
            'kms_status' => $kmsStatus,
            'nutrition_status' => $nutritionStatus,
            'vitamin_a' => $validated['vitamin_a'] ?? false,
            'notes' => $validated['notes'] ?? null,
            'rfid_uid' => $validated['rfid_uid'] ?? null,
            'measured_at' => now(),
            'officer_id' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Data penimbangan & grafik KMS Balita berhasil dicatat.',
            'data' => $record->load(['parent.house', 'officer']),
        ], 201);
    }

    /**
     * List Immunization Schedules & Records
     */
    public function listImmunizations(Request $request)
    {
        $user = $request->user();
        $query = ImmunizationRecord::with(['parent.house', 'officer']);

        if ($user->role === 'warga') {
            $query->where('parent_user_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('child_name', 'like', "%{$search}%")
                  ->orWhere('vaccine_name', 'like', "%{$search}%");
            });
        }

        $records = $query->orderBy('scheduled_date', 'asc')->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $records,
        ]);
    }

    /**
     * Store Immunization Schedule or Administered Vaccine
     */
    public function storeImmunization(Request $request)
    {
        $validated = $request->validate([
            'child_name' => 'required|string|max:100',
            'parent_user_id' => 'nullable|exists:users,id',
            'vaccine_name' => 'required|string|max:100',
            'target_age_months' => 'nullable|integer|min:0|max:60',
            'scheduled_date' => 'required|date',
            'administered_date' => 'nullable|date',
            'status' => 'nullable|in:scheduled,completed,missed',
            'batch_number' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:500',
        ]);

        $status = $validated['status'] ?? (!empty($validated['administered_date']) ? 'completed' : 'scheduled');

        $record = ImmunizationRecord::create([
            'child_name' => $validated['child_name'],
            'parent_user_id' => $validated['parent_user_id'] ?? ($request->user()->role === 'warga' ? $request->user()->id : null),
            'vaccine_name' => $validated['vaccine_name'],
            'target_age_months' => $validated['target_age_months'] ?? 0,
            'scheduled_date' => $validated['scheduled_date'],
            'administered_date' => $validated['administered_date'] ?? ($status === 'completed' ? now()->toDateString() : null),
            'status' => $status,
            'batch_number' => $validated['batch_number'] ?? null,
            'officer_id' => $request->user()->id,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Jadwal / catatan imunisasi balita berhasil disimpan.',
            'data' => $record->load(['parent.house', 'officer']),
        ], 201);
    }

    /**
     * Update Immunization Status (e.g. mark as completed after vaccination)
     */
    public function updateImmunization(Request $request, $id)
    {
        $record = ImmunizationRecord::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:scheduled,completed,missed',
            'administered_date' => 'nullable|date',
            'batch_number' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:500',
        ]);

        $record->update([
            'status' => $validated['status'],
            'administered_date' => $validated['administered_date'] ?? ($validated['status'] === 'completed' ? now()->toDateString() : $record->administered_date),
            'batch_number' => $validated['batch_number'] ?? $record->batch_number,
            'officer_id' => $request->user()->id,
            'notes' => $validated['notes'] ?? $record->notes,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status imunisasi balita berhasil diperbarui.',
            'data' => $record->fresh(['parent.house', 'officer']),
        ]);
    }

    /**
     * List Posyandu Lansia Health Records
     */
    public function listElderly(Request $request)
    {
        $user = $request->user();
        $query = ElderlyHealthRecord::with(['user.house', 'officer']);

        if ($user->role === 'warga') {
            $query->where('user_id', $user->id);
        } else {
            if ($request->filled('rt_number')) {
                $query->where('rt_number', $request->rt_number);
            }
        }

        if ($request->filled('blood_pressure_status')) {
            $query->where('blood_pressure_status', $request->blood_pressure_status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('elderly_name', 'like', "%{$search}%")
                  ->orWhere('risk_assessment', 'like', "%{$search}%");
            });
        }

        $records = $query->latest('examined_at')->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $records,
        ]);
    }

    /**
     * Store Elderly Health Screening Record
     */
    public function storeElderly(Request $request)
    {
        $validated = $request->validate([
            'elderly_name' => 'required|string|max:100',
            'user_id' => 'nullable|exists:users,id',
            'gender' => 'required|in:L,P',
            'age' => 'required|integer|min:45|max:120',
            'rt_number' => 'nullable|string|max:10',
            'systolic' => 'required|integer|min:60|max:260',
            'diastolic' => 'required|integer|min:40|max:160',
            'blood_sugar' => 'nullable|numeric|min:40|max:600',
            'cholesterol' => 'nullable|numeric|min:80|max:500',
            'uric_acid' => 'nullable|numeric|min:1|max:25',
            'weight_kg' => 'nullable|numeric|min:20|max:200',
            'waist_circumference_cm' => 'nullable|numeric|min:40|max:180',
            'recommendations' => 'nullable|string|max:500',
        ]);

        $eval = ElderlyHealthRecord::formulateRiskAssessment(
            (int) $validated['systolic'],
            (int) $validated['diastolic'],
            isset($validated['blood_sugar']) ? (float) $validated['blood_sugar'] : null,
            isset($validated['cholesterol']) ? (float) $validated['cholesterol'] : null,
            isset($validated['uric_acid']) ? (float) $validated['uric_acid'] : null,
            $validated['gender']
        );

        $rtNumber = $validated['rt_number'] ?? null;
        if (!$rtNumber && !empty($validated['user_id'])) {
            $warga = User::find($validated['user_id']);
            $rtNumber = $warga?->rt_number;
        }

        $record = ElderlyHealthRecord::create([
            'user_id' => $validated['user_id'] ?? null,
            'elderly_name' => $validated['elderly_name'],
            'gender' => $validated['gender'],
            'age' => $validated['age'],
            'rt_number' => $rtNumber ?? '01',
            'systolic' => $validated['systolic'],
            'diastolic' => $validated['diastolic'],
            'blood_pressure_status' => $eval['blood_pressure_status'],
            'blood_sugar' => $validated['blood_sugar'] ?? null,
            'cholesterol' => $validated['cholesterol'] ?? null,
            'uric_acid' => $validated['uric_acid'] ?? null,
            'weight_kg' => $validated['weight_kg'] ?? null,
            'waist_circumference_cm' => $validated['waist_circumference_cm'] ?? null,
            'risk_assessment' => $eval['risk_assessment'],
            'recommendations' => (!empty($validated['recommendations'])) ? $validated['recommendations'] : $eval['recommendations'],
            'examined_at' => now(),
            'officer_id' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Hasil skrining & pemantauan kesehatan lansia berhasil dicatat.',
            'data' => $record->load(['user.house', 'officer']),
        ], 201);
    }

    /**
     * Posyandu Dashboard Summary Metrics
     */
    public function summary(Request $request)
    {
        $user = $request->user();

        $balitaTotal = PosyanduRecord::count();
        $balitaGreen = PosyanduRecord::where('kms_status', 'green')->count();
        $balitaYellow = PosyanduRecord::where('kms_status', 'yellow')->count();
        $balitaRed = PosyanduRecord::where('kms_status', 'red')->count();

        $imunTotal = ImmunizationRecord::count();
        $imunCompleted = ImmunizationRecord::where('status', 'completed')->count();
        $imunScheduled = ImmunizationRecord::where('status', 'scheduled')->count();

        $lansiaTotal = ElderlyHealthRecord::count();
        $lansiaHipertensi = ElderlyHealthRecord::whereIn('blood_pressure_status', ['hypertension_stage1', 'hypertension_stage2'])->count();
        $lansiaNormal = ElderlyHealthRecord::where('blood_pressure_status', 'normal')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'balita' => [
                    'total_records' => $balitaTotal,
                    'kms_green' => $balitaGreen,
                    'kms_yellow' => $balitaYellow,
                    'kms_red' => $balitaRed,
                ],
                'imunisasi' => [
                    'total' => $imunTotal,
                    'completed' => $imunCompleted,
                    'scheduled' => $imunScheduled,
                ],
                'lansia' => [
                    'total_records' => $lansiaTotal,
                    'normal' => $lansiaNormal,
                    'hipertensi' => $lansiaHipertensi,
                ],
            ],
        ]);
    }
}
