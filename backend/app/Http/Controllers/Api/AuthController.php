<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\House;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Warga Registration (Pendaftaran Mandiri)
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'rt_number' => 'required|string|in:01,02,03',
            'house_id' => 'required|exists:houses,id',
            'kk_type' => 'nullable|string|in:kk_utama,kk_pendukung,anggota',
            'no_kk' => 'nullable|string|max:30',
            'nik' => 'nullable|string|max:30',
            'birth_place' => 'nullable|string|max:100',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|string|max:20',
            'religion' => 'nullable|string|max:30',
            'occupation' => 'nullable|string|max:100',
            'marital_status' => 'nullable|string|max:30',
            'blood_type' => 'nullable|string|max:10',
            'rfid_uid' => 'nullable|string|max:50',
            'phone' => 'nullable|string|max:25',
        ]);

        $house = House::with('headOfFamily')->findOrFail($validated['house_id']);
        if ($house->rt_number !== $validated['rt_number']) {
            return response()->json([
                'success' => false,
                'message' => 'Rumah yang dipilih tidak sesuai dengan RT yang dipilih.',
            ], 422);
        }

        // Rumah yang sudah memiliki KK Utama tidak mengizinkan pendaftaran akun login mandiri baru
        if ($house->head_of_family_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unit rumah ' . $house->house_code . ' sudah memiliki KK Utama (' . $house->headOfFamily?->name . '). KK Tambahan serumah tidak memiliki akses login mandiri dan hanya dapat didaftarkan langsung oleh KK Utama melalui sistem.',
            ], 422);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'warga',
            'rt_number' => $validated['rt_number'],
            'house_id' => $validated['house_id'],
            'kk_type' => 'kk_utama',
            'no_kk' => $validated['no_kk'] ?? null,
            'nik' => $validated['nik'] ?? null,
            'birth_place' => $validated['birth_place'] ?? null,
            'birth_date' => $validated['birth_date'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'religion' => $validated['religion'] ?? 'Islam',
            'occupation' => $validated['occupation'] ?? null,
            'marital_status' => $validated['marital_status'] ?? null,
            'blood_type' => $validated['blood_type'] ?? null,
            'relationship' => 'Kepala Keluarga',
            'is_head_of_house' => true,
            'rfid_uid' => $validated['rfid_uid'] ?? null,
            'status' => 'pending', // Pendaftaran mandiri berstatus PENDING hingga di-ACC Ketua RT
            'phone' => $validated['phone'] ?? null,
        ]);

        // Buat dompet awal
        Wallet::create([
            'user_id' => $user->id,
            'balance' => 0.00,
        ]);

        // Sesuai regulasi: Tidak menerbitkan token login langsung untuk akun pending
        return response()->json([
            'success' => true,
            'message' => 'Pendaftaran mandiri berhasil diajukan! Sesuai tata tertib RW 05, akun Anda saat ini berstatus PENDING dan harus mendapatkan verifikasi serta persetujuan (ACC) dari Ketua RT ' . $user->rt_number . ' sebelum Anda dapat masuk ke dalam sistem. Silakan konfirmasi ke Ketua RT setempat.',
            'data' => [
                'user' => $user->load(['house', 'wallet']),
                'token' => null,
            ]
        ], 201);
    }

    /**
     * User Login
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::with([
            'house.headOfFamily',
            'house.kkPendukung',
            'house.residents',
            'wallet'
        ])->where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Kredensial yang diberikan tidak cocok dengan data kami.'],
            ]);
        }

        // 1. Pemeriksaan Unit Rumah: Warga yang belum memiliki/masuk ke rumah TIDAK BISA LOGIN
        if ($user->role === 'warga' && (!$user->house_id || !$user->house)) {
            return response()->json([
                'success' => false,
                'message' => 'Akun warga Anda belum terdaftar atau belum menempati unit rumah resmi di lingkungan RW 05. Anda tidak diizinkan masuk sebelum didaftarkan/ditempatkan ke dalam unit rumah oleh Pengurus RT.',
            ], 403);
        }

        // 2. Pemeriksaan Status Akun: Warga yang masih berstatus PENDING (belum di-ACC RT) TIDAK BISA LOGIN
        if ($user->role === 'warga' && $user->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Pendaftaran akun Anda masih berstatus PENDING menunggu verifikasi dan persetujuan (ACC) dari Ketua RT ' . ($user->rt_number ?? 'setempat') . '. Anda belum dapat masuk ke sistem sampai akun Anda disetujui.',
            ], 403);
        }

        // 3. Pemeriksaan Hak Akses Login: KK Tambahan tidak memiliki akses login mandiri
        if ($user->role === 'warga' && ($user->kk_type === 'kk_pendukung' || !$user->is_head_of_house)) {
            return response()->json([
                'success' => false,
                'message' => 'KK Tambahan tidak memiliki akses untuk login. Yang bertanggung jawab untuk iuran dan seluruh urusan administrasi unit rumah adalah KK Utama.',
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data' => [
                'user' => $user,
                'token' => $token,
            ]
        ]);
    }

    /**
     * User Logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.',
        ]);
    }

    /**
     * User Profile
     */
    public function profile(Request $request)
    {
        $user = $request->user()->load([
            'house.headOfFamily',
            'house.kkPendukung',
            'house.residents',
            'wallet'
        ]);

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    /**
     * Update Profile & Biodata Lengkap KTP/Kependudukan
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'nullable|string|max:25',
            'nik' => 'nullable|string|max:30',
            'no_kk' => 'nullable|string|max:30',
            'birth_place' => 'nullable|string|max:100',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|string|max:20',
            'religion' => 'nullable|string|max:30',
            'occupation' => 'nullable|string|max:100',
            'marital_status' => 'nullable|string|max:30',
            'blood_type' => 'nullable|string|max:10',
            'relationship' => 'nullable|string|max:50',
            'rfid_uid' => 'nullable|string|max:50',
            'avatar' => 'nullable|string',
        ]);

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Biodata profil berhasil diperbarui.',
            'data' => $user->fresh([
                'house.headOfFamily',
                'house.kkPendukung',
                'house.residents',
                'wallet'
            ]),
        ]);
    }

    /**
     * Public list of houses for registration selection
     */
    public function getHouseList(Request $request)
    {
        $query = House::with([
            'headOfFamily:id,name,phone,email,no_kk',
            'kkPendukung:id,name,phone,no_kk,house_id'
        ])->withCount('residents');

        if ($request->has('rt_number') && $request->rt_number) {
            $query->where('rt_number', $request->rt_number);
        }

        if ($request->has('block') && $request->block) {
            $query->where('block', $request->block);
        }

        $houses = $query->orderBy('rt_number')
                        ->orderBy('block')
                        ->orderBy('number')
                        ->get();

        return response()->json([
            'success' => true,
            'data' => $houses,
        ]);
    }

    /**
     * Sensus Lengkap 300 Unit Rumah (100 per RT)
     */
    public function getHousesCensus(Request $request)
    {
        $currentUser = $request->user();
        $query = House::with([
            'headOfFamily:id,name,phone,email,no_kk,nik,status',
            'kkPendukung:id,name,phone,email,no_kk,nik,status,house_id',
            'residents:id,name,phone,email,no_kk,nik,status,house_id,kk_type',
            'billings' => function ($q) {
                $q->latest()->limit(1);
            }
        ]);

        if ($currentUser?->role === 'rt') {
            $query->where('rt_number', $currentUser->rt_number);
        } elseif ($request->has('rt_number') && $request->rt_number) {
            $query->where('rt_number', $request->rt_number);
        }

        if ($request->has('block') && $request->block) {
            $query->where('block', $request->block);
        }

        if ($request->has('is_occupied')) {
            $query->where('is_occupied', filter_var($request->is_occupied, FILTER_VALIDATE_BOOLEAN));
        }

        $houses = $query->orderBy('rt_number')
                        ->orderBy('block')
                        ->orderBy('number')
                        ->get();

        // Statistics
        $totalHouses = $houses->count();
        $occupiedHouses = $houses->where('is_occupied', true)->count();
        $emptyHouses = $totalHouses - $occupiedHouses;
        $totalKkUtama = $houses->whereNotNull('head_of_family_id')->count();
        $totalKkPendukung = $houses->sum(function ($h) {
            return $h->kkPendukung->count();
        });

        return response()->json([
            'success' => true,
            'statistics' => [
                'total_houses' => $totalHouses,
                'occupied_houses' => $occupiedHouses,
                'empty_houses' => $emptyHouses,
                'total_kk_utama' => $totalKkUtama,
                'total_kk_pendukung' => $totalKkPendukung,
            ],
            'data' => $houses,
        ]);
    }

    /**
     * Detail 1 Unit Rumah & penghuni di dalamnya
     */
    public function getHouseDetail($id)
    {
        $house = House::with([
            'headOfFamily',
            'kkPendukung',
            'residents',
            'billings.master'
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $house,
        ]);
    }

    /**
     * Assign / Change KK Utama (Penanggung Jawab Rumah)
     */
    public function assignHeadOfFamily(Request $request, $id)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $house = House::findOrFail($id);
        $user = User::findOrFail($validated['user_id']);

        if ($user->house_id !== $house->id) {
            return response()->json([
                'success' => false,
                'message' => 'Warga yang dipilih tidak terdaftar di rumah ini.',
            ], 422);
        }

        // Demote existing head if different
        if ($house->head_of_family_id && $house->head_of_family_id !== $user->id) {
            User::where('id', $house->head_of_family_id)->update([
                'is_head_of_house' => false,
                'kk_type' => 'kk_pendukung',
            ]);
        }

        $house->update([
            'head_of_family_id' => $user->id,
            'is_occupied' => true,
        ]);

        $user->update([
            'is_head_of_house' => true,
            'kk_type' => 'kk_utama',
        ]);

        return response()->json([
            'success' => true,
            'message' => "KK Utama untuk rumah {$house->house_code} berhasil ditetapkan kepada {$user->name}.",
            'data' => $house->fresh(['headOfFamily', 'kkPendukung', 'residents']),
        ]);
    }

    /**
     * Pengurus list of citizens (with pending/approved filter)
     */
    public function listWarga(Request $request)
    {
        $currentUser = $request->user();
        $query = User::with(['house', 'wallet'])->where('role', 'warga');

        // RT can only view citizens in their own RT
        if ($currentUser->role === 'rt') {
            $query->where('rt_number', $currentUser->rt_number);
        } elseif ($request->has('rt_number') && $request->rt_number) {
            $query->where('rt_number', $request->rt_number);
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $wargaList = $query->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $wargaList,
        ]);
    }

    /**
     * Approve citizen registration
     */
    public function approveWarga(Request $request, $id)
    {
        $currentUser = $request->user();
        $targetUser = User::findOrFail($id);

        // Check authority
        if ($currentUser->role === 'rt' && $currentUser->rt_number !== $targetUser->rt_number) {
            return response()->json([
                'success' => false,
                'message' => 'Anda hanya berhak menyetujui warga di RT ' . $currentUser->rt_number . '.',
            ], 403);
        }

        $targetUser->update(['status' => 'approved']);

        if ($targetUser->house_id) {
            $house = House::find($targetUser->house_id);
            if ($house) {
                $houseUpdate = ['is_occupied' => true];
                // Jika rumah belum punya KK Utama atau user mendaftar sebagai KK Utama
                if (!$house->head_of_family_id || $targetUser->kk_type === 'kk_utama') {
                    $houseUpdate['head_of_family_id'] = $targetUser->id;
                    $targetUser->update(['is_head_of_house' => true]);
                }
                $house->update($houseUpdate);
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Warga {$targetUser->name} berhasil disetujui.",
            'data' => $targetUser->fresh(['house', 'wallet']),
        ]);
    }

    /**
     * Reject or Remove citizen registration
     */
    public function rejectWarga(Request $request, $id)
    {
        $currentUser = $request->user();
        $targetUser = User::findOrFail($id);

        if ($currentUser->role === 'rt' && $currentUser->rt_number !== $targetUser->rt_number) {
            return response()->json([
                'success' => false,
                'message' => 'Anda hanya berhak menolak warga di RT ' . $currentUser->rt_number . '.',
            ], 403);
        }

        $targetUser->delete();

        return response()->json([
            'success' => true,
            'message' => "Pendaftaran warga berhasil ditolak / dihapus.",
        ]);
    }

    /**
     * KK Utama adds KK Tambahan / Pendukung to their house
     */
    public function addFamilyKk(Request $request)
    {
        $currentUser = $request->user();

        if (!$currentUser->house_id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda belum terhubung ke unit rumah mana pun.',
            ], 422);
        }

        $house = House::findOrFail($currentUser->house_id);

        // Hanya KK Utama atau Pengurus yang berhak menambahkan
        if ($house->head_of_family_id !== $currentUser->id && !$currentUser->isPengurus()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya KK Utama (Penanggung Jawab Rumah) yang berwenang menambahkan KK Tambahan ke unit rumah ini.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'no_kk' => 'required|string|max:30',
            'nik' => 'required|string|max:30',
            'relationship' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:25',
            'email' => 'nullable|string|email|max:255',
        ]);

        $cleanNik = preg_replace('/[^0-9]/', '', $validated['nik']);
        $email = $validated['email'] ?? ('kk_' . $cleanNik . '@smartwarga.local');
        if (User::where('email', $email)->exists()) {
            $email = 'kk_' . $cleanNik . '_' . time() . '@smartwarga.local';
        }

        $newUser = User::create([
            'name' => $validated['name'],
            'email' => $email,
            'password' => Hash::make(Str::random(32)), // Random password: KK Tambahan tidak memiliki akses login
            'role' => 'warga',
            'rt_number' => $house->rt_number,
            'house_id' => $house->id,
            'kk_type' => 'kk_pendukung',
            'no_kk' => $validated['no_kk'],
            'nik' => $validated['nik'],
            'is_head_of_house' => false,
            'status' => 'approved', // Langsung terdata sah di unit rumah
            'phone' => $validated['phone'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Data KK Tambahan / Pendukung atas nama {$newUser->name} (No KK: {$newUser->no_kk}) berhasil dicatat pada unit rumah {$house->house_code}. Seluruh urusan iuran dan administrasi dikelola oleh KK Utama.",
            'data' => [
                'user' => $newUser,
                'house' => $house->fresh(['headOfFamily', 'kkPendukung', 'residents']),
            ]
        ], 201);
    }

    /**
     * Dapatkan daftar seluruh anggota keluarga serumah
     */
    public function getFamilyMembers(Request $request)
    {
        $user = $request->user();
        if (!$user->house_id) {
            return response()->json([
                'success' => true,
                'data' => [],
            ]);
        }

        $members = User::where('house_id', $user->house_id)
            ->orderByRaw("FIELD(kk_type, 'kk_utama', 'kk_pendukung', 'anggota')")
            ->orderBy('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $members,
        ]);
    }

    /**
     * Tambah anggota keluarga serumah dengan biodata lengkap
     */
    public function saveFamilyMember(Request $request)
    {
        $currentUser = $request->user();

        if (!$currentUser->house_id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda belum terdaftar pada unit rumah mana pun.',
            ], 422);
        }

        $house = House::findOrFail($currentUser->house_id);

        if ($house->head_of_family_id !== $currentUser->id && !$currentUser->isPengurus()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya KK Utama (Penanggung Jawab Rumah) yang berwenang menambahkan data anggota keluarga ke unit rumah ini.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nik' => 'nullable|string|max:30',
            'no_kk' => 'nullable|string|max:30',
            'relationship' => 'required|string|max:50', // 'Istri', 'Anak', 'Orang Tua', 'Famili Lain', 'KK Tambahan'
            'birth_place' => 'nullable|string|max:100',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|string|max:20',
            'religion' => 'nullable|string|max:30',
            'occupation' => 'nullable|string|max:100',
            'marital_status' => 'nullable|string|max:30',
            'blood_type' => 'nullable|string|max:10',
            'phone' => 'nullable|string|max:25',
            'email' => 'nullable|string|email|max:255',
            'kk_type' => 'nullable|string|in:kk_utama,kk_pendukung,anggota',
        ]);

        $cleanNik = !empty($validated['nik']) ? preg_replace('/[^0-9]/', '', $validated['nik']) : (string) time();
        $email = $validated['email'] ?? ('fam_' . $cleanNik . '@smartwarga.local');
        if (User::where('email', $email)->exists()) {
            $email = 'fam_' . $cleanNik . '_' . Str::random(4) . '@smartwarga.local';
        }

        $kkType = $validated['kk_type'] ?? ($validated['relationship'] === 'KK Tambahan' ? 'kk_pendukung' : 'anggota');

        $member = User::create([
            'name' => $validated['name'],
            'email' => $email,
            'password' => Hash::make(Str::random(32)),
            'role' => 'warga',
            'rt_number' => $house->rt_number,
            'house_id' => $house->id,
            'kk_type' => $kkType,
            'no_kk' => $validated['no_kk'] ?? $currentUser->no_kk,
            'nik' => $validated['nik'] ?? null,
            'birth_place' => $validated['birth_place'] ?? null,
            'birth_date' => $validated['birth_date'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'religion' => $validated['religion'] ?? 'Islam',
            'occupation' => $validated['occupation'] ?? null,
            'marital_status' => $validated['marital_status'] ?? null,
            'blood_type' => $validated['blood_type'] ?? null,
            'relationship' => $validated['relationship'],
            'phone' => $validated['phone'] ?? null,
            'is_head_of_house' => false,
            'status' => 'approved',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Anggota keluarga {$member->name} ({$member->relationship}) berhasil ditambahkan ke unit rumah {$house->house_code}.",
            'data' => $member,
        ], 201);
    }

    /**
     * Perbarui biodata anggota keluarga serumah
     */
    public function updateFamilyMember(Request $request, $id)
    {
        $currentUser = $request->user();
        $targetUser = User::findOrFail($id);

        if ($targetUser->house_id !== $currentUser->house_id && !$currentUser->isPengurus()) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki hak untuk mengedit data warga di luar rumah Anda.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'nik' => 'nullable|string|max:30',
            'no_kk' => 'nullable|string|max:30',
            'relationship' => 'nullable|string|max:50',
            'birth_place' => 'nullable|string|max:100',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|string|max:20',
            'religion' => 'nullable|string|max:30',
            'occupation' => 'nullable|string|max:100',
            'marital_status' => 'nullable|string|max:30',
            'blood_type' => 'nullable|string|max:10',
            'phone' => 'nullable|string|max:25',
        ]);

        $targetUser->update($validated);

        return response()->json([
            'success' => true,
            'message' => "Biodata anggota keluarga {$targetUser->name} berhasil diperbarui.",
            'data' => $targetUser,
        ]);
    }

    /**
     * Hapus anggota keluarga dari unit rumah
     */
    public function deleteFamilyMember(Request $request, $id)
    {
        $currentUser = $request->user();
        $targetUser = User::findOrFail($id);

        if ($targetUser->house_id !== $currentUser->house_id && !$currentUser->isPengurus()) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki hak untuk menghapus data warga di luar rumah Anda.',
            ], 403);
        }

        if ($targetUser->id === $currentUser->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menghapus akun Anda sendiri sebagai KK Utama.',
            ], 422);
        }

        if ($targetUser->is_head_of_house) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat menghapus KK Utama / Penanggung Jawab Rumah.',
            ], 422);
        }

        $targetUser->delete();

        return response()->json([
            'success' => true,
            'message' => "Anggota keluarga {$targetUser->name} berhasil dihapus dari data rumah.",
        ]);
    }
}
