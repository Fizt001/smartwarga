<?php

use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\AssetLoanController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ComplaintController;
use App\Http\Controllers\Api\IoTController;
use App\Http\Controllers\Api\IplController;
use App\Http\Controllers\Api\KoperasiController;
use App\Http\Controllers\Api\LetterController;
use App\Http\Controllers\Api\PayrollExpenseController;
use App\Http\Controllers\Api\PosyanduController;
use App\Http\Controllers\Api\RukamController;
use App\Http\Controllers\Api\UmkmController;
use App\Http\Controllers\Api\WalletController;
use App\Models\WasteRate;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::get('/houses', [AuthController::class, 'getHouseList']);
Route::get('/houses/census', [AuthController::class, 'getHousesCensus']);
Route::get('/houses/{id}', [AuthController::class, 'getHouseDetail']);
Route::get('/letters/{id}/download', [LetterController::class, 'downloadPdf']);

Route::get('/waste-rates', function () {
    return response()->json([
        'success' => true,
        'data' => WasteRate::all(),
    ]);
});

/*
|--------------------------------------------------------------------------
| IoT Node Endpoints (ESP32 Gate, Siren, Waste/Posyandu Terminal)
|--------------------------------------------------------------------------
*/
Route::prefix('iot')->group(function () {
    Route::post('/ronda/tap', [IoTController::class, 'rondaTap']);
    Route::post('/panic-button', [IoTController::class, 'panicButton']);
    Route::get('/sirine/status', [IoTController::class, 'sirineStatus']);
    Route::post('/bank-sampah/setor', [IoTController::class, 'bankSampahSetor']);
    Route::post('/posyandu/catat', [IoTController::class, 'posyanduCatat']);
    Route::get('/devices', [IoTController::class, 'listDevices']);
});

/*
|--------------------------------------------------------------------------
| Authenticated User Routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Auth & Profile (Available even if pending)
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/profile', [AuthController::class, 'profile']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
    });

    // Warga Features (Protected: must be approved)
    Route::middleware('approved')->group(function () {
        // IPL & Billing (Annual 12-Month Calendar & QRIS)
        Route::get('/ipl/billings', [IplController::class, 'listBillings']);
        Route::get('/ipl/annual-calendar', [IplController::class, 'getAnnualCalendar']);
        Route::post('/ipl/pay-qris', [IplController::class, 'payViaQris']);
        Route::post('/ipl/billings/{id}/pay-wallet', [IplController::class, 'payViaWallet']);
        Route::post('/ipl/billings/{id}/pay-upload', [IplController::class, 'payViaUpload']);

        // Biodata & Data Anggota Keluarga Serumah
        Route::get('/warga/family-members', [AuthController::class, 'getFamilyMembers']);
        Route::post('/warga/family-members', [AuthController::class, 'saveFamilyMember']);
        Route::put('/warga/family-members/{id}', [AuthController::class, 'updateFamilyMember']);
        Route::delete('/warga/family-members/{id}', [AuthController::class, 'deleteFamilyMember']);
        Route::post('/warga/add-family-kk', [AuthController::class, 'addFamilyKk']);

        // Wallet
        Route::get('/wallet/balance', [WalletController::class, 'getBalance']);
        Route::get('/wallet/transactions', [WalletController::class, 'getTransactions']);
        Route::post('/wallet/topup-request', [WalletController::class, 'requestTopup']);

        // Persuratan
        Route::get('/letters', [LetterController::class, 'index']);
        Route::post('/letters', [LetterController::class, 'store']);
        Route::get('/letters/{id}', [LetterController::class, 'show']);

        // Pengaduan
        Route::get('/complaints', [ComplaintController::class, 'index']);
        Route::post('/complaints', [ComplaintController::class, 'store']);
        Route::get('/complaints/{id}', [ComplaintController::class, 'show']);

        // Agenda & Pengumuman
        Route::get('/announcements', [AnnouncementController::class, 'index']);
        Route::post('/announcements', [AnnouncementController::class, 'store']);
        Route::post('/announcements/{id}/rsvp', [AnnouncementController::class, 'rsvp']);
        Route::post('/announcements/{id}/donate', [AnnouncementController::class, 'donate']);

        // Transparansi Rekap Kas RT ke RW (Bisa dilihat oleh Warga & Pengurus)
        Route::get('/ipl/rekap-rw', [IplController::class, 'rekapKasRtToRw']);

        // UMKM
        Route::get('/umkm', [UmkmController::class, 'index']);
        Route::post('/umkm', [UmkmController::class, 'store']);
        Route::put('/umkm/{id}', [UmkmController::class, 'update']);
        Route::delete('/umkm/{id}', [UmkmController::class, 'destroy']);

        // Aset RT
        Route::get('/assets', [AssetLoanController::class, 'indexAssets']);
        Route::post('/assets/loans', [AssetLoanController::class, 'requestLoan']);
        Route::get('/assets/loans', [AssetLoanController::class, 'listLoans']);

        // Koperasi
        Route::get('/koperasi/loans', [KoperasiController::class, 'listLoans']);
        Route::post('/koperasi/loans', [KoperasiController::class, 'applyLoan']);

        // RUKAM & Santunan Duka
        Route::get('/rukam', [RukamController::class, 'index']);
        Route::get('/rukam/summary', [RukamController::class, 'summary']);
        Route::get('/rukam/{id}', [RukamController::class, 'show']);
        Route::post('/rukam', [RukamController::class, 'report']);
        Route::post('/rukam/{id}/verify', [RukamController::class, 'verify'])->middleware('role:super_admin,rw,rt,bendahara,sekretaris');
        Route::post('/rukam/{id}/disburse', [RukamController::class, 'disburse'])->middleware('role:super_admin,rw,rt,bendahara,sekretaris');

        // Ambulans Siaga Warga
        Route::get('/ambulances', [RukamController::class, 'ambulances']);
        Route::post('/ambulances', [RukamController::class, 'storeAmbulance'])->middleware('role:super_admin,rw,rt,bendahara,sekretaris');
        Route::patch('/ambulances/{id}/status', [RukamController::class, 'updateAmbulanceStatus'])->middleware('role:super_admin,rw,rt,bendahara,sekretaris');
        Route::get('/ambulances/bookings', [RukamController::class, 'bookings']);
        Route::post('/ambulances/bookings', [RukamController::class, 'bookAmbulance']);
        Route::post('/ambulances/bookings/{id}/dispatch', [RukamController::class, 'dispatchAmbulance'])->middleware('role:super_admin,rw,rt,bendahara,sekretaris');
        Route::post('/ambulances/bookings/{id}/complete', [RukamController::class, 'completeBooking'])->middleware('role:super_admin,rw,rt,bendahara,sekretaris');
        Route::post('/ambulances/bookings/{id}/cancel', [RukamController::class, 'cancelBooking']);

        // Posyandu Digital (KMS Balita, Imunisasi, & Kesehatan Lansia)
        Route::get('/posyandu', [PosyanduController::class, 'index']);
        Route::post('/posyandu', [PosyanduController::class, 'store']);
        Route::get('/posyandu/summary', [PosyanduController::class, 'summary']);
        Route::get('/posyandu/immunizations', [PosyanduController::class, 'listImmunizations']);
        Route::post('/posyandu/immunizations', [PosyanduController::class, 'storeImmunization']);
        Route::patch('/posyandu/immunizations/{id}', [PosyanduController::class, 'updateImmunization']);
        Route::get('/posyandu/lansia', [PosyanduController::class, 'listElderly']);
        Route::post('/posyandu/lansia', [PosyanduController::class, 'storeElderly']);

        // IoT Monitoring & Logs
        Route::post('/iot/sirine/toggle', [IoTController::class, 'toggleSirine']);
        Route::get('/iot/ronda/logs', [IoTController::class, 'rondaLogs']);
        Route::get('/iot/emergency-logs', [IoTController::class, 'emergencyLogs']);
        Route::get('/iot/waste-bank/logs', [IoTController::class, 'wasteBankLogs']);

        // Payroll & Routine Operational Expenses (Satpam & Sampah)
        Route::get('/payroll/summary', [PayrollExpenseController::class, 'summary']);
        Route::get('/payroll/audit-simulation', [PayrollExpenseController::class, 'auditSimulation']);
    });

    // Pengurus & Admin Management Routes
    Route::prefix('admin')->middleware('role:super_admin,rw,rt,bendahara,sekretaris')->group(function () {
        // Warga Management & Approval
        Route::get('/warga', [AuthController::class, 'listWarga']);
        Route::post('/warga/{id}/approve', [AuthController::class, 'approveWarga']);
        Route::delete('/warga/{id}', [AuthController::class, 'rejectWarga']);
        Route::post('/houses/{id}/assign-head', [AuthController::class, 'assignHeadOfFamily']);

        // IPL Management
        Route::get('/ipl/masters', [IplController::class, 'indexMasters']);
        Route::post('/ipl/masters', [IplController::class, 'storeMaster']);
        Route::post('/ipl/generate/{masterId}', [IplController::class, 'generateMonthlyBills']);
        Route::post('/ipl/generate-period', [IplController::class, 'generateByPeriod']);
        Route::post('/ipl/billings/{id}/verify', [IplController::class, 'verifyPayment']);
        Route::get('/ipl/rekap-rw', [IplController::class, 'rekapKasRtToRw']);

        // Payroll & Operational Expenses Management (Satpam, Sampah, Operasional)
        Route::get('/payroll/expenses', [PayrollExpenseController::class, 'index']);
        Route::post('/payroll/expenses', [PayrollExpenseController::class, 'store']);
        Route::post('/payroll/expenses/{id}/approve', [PayrollExpenseController::class, 'approve']);
        Route::post('/payroll/expenses/{id}/disburse', [PayrollExpenseController::class, 'disburse']);

        // Wallet Top-Up Management (Bendahara / Admin)
        Route::get('/wallet/pending-topups', [WalletController::class, 'listPendingTopups']);
        Route::post('/wallet/topups/{id}/verify', [WalletController::class, 'verifyTopup']);

        // Letters Approval
        Route::post('/letters/{id}/approve-rt', [LetterController::class, 'approveRt']);
        Route::post('/letters/{id}/approve-rw', [LetterController::class, 'approveRw']);
        Route::post('/letters/{id}/reject', [LetterController::class, 'reject']);

        // Complaints Handling
        Route::patch('/complaints/{id}/status', [ComplaintController::class, 'updateStatus']);

        // Announcements & Kegiatan Creation & Budget Decision (Sekretaris & Bendahara)
        Route::post('/announcements', [AnnouncementController::class, 'store']);
        Route::post('/announcements/{id}/budget-decision', [AnnouncementController::class, 'budgetDecision']);
        Route::post('/announcements/{id}/financial-report', [AnnouncementController::class, 'updateFinancialReport']);

        // Asset & Loans Management
        Route::post('/assets', [AssetLoanController::class, 'storeAsset']);
        Route::post('/assets/loans/{id}/approve', [AssetLoanController::class, 'approveLoan']);
        Route::post('/assets/loans/{id}/reject', [AssetLoanController::class, 'rejectLoan']);
        Route::post('/assets/loans/{id}/return', [AssetLoanController::class, 'markReturned']);

        // Koperasi Loan Approval & Disbursement
        Route::post('/koperasi/loans/{id}/approve', [KoperasiController::class, 'approveLoan']);

        // RUKAM Santunan Verification & Disbursement
        Route::post('/rukam/{id}/verify', [RukamController::class, 'verify']);
        Route::post('/rukam/{id}/disburse', [RukamController::class, 'disburse']);

        // Ambulans Siaga Pengurus Operations
        Route::post('/ambulances', [RukamController::class, 'storeAmbulance']);
        Route::patch('/ambulances/{id}/status', [RukamController::class, 'updateAmbulanceStatus']);
        Route::post('/ambulances/bookings/{id}/dispatch', [RukamController::class, 'dispatchAmbulance']);
        Route::post('/ambulances/bookings/{id}/complete', [RukamController::class, 'completeBooking']);
    });
});
