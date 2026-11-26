<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Tambahkan role 'satpam' ke enum tabel users
        try {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'rw', 'rt', 'warga', 'bendahara', 'sekretaris', 'satpam') DEFAULT 'warga'");
        } catch (\Throwable $e) {
            // Fallback jika database bukan MySQL (misal SQLite di test)
        }

        // 2. Buat tabel riwayat klaim & alokasi IoT ("tarik-tarikan" area Satpam vs Kios)
        Schema::create('iot_claims', function (Blueprint $table) {
            $table->id();
            $table->enum('duty_area', ['satpam_gerbang', 'kios_pelayanan'])->default('satpam_gerbang');
            $table->foreignId('claimed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('claimed_by_name', 100);
            $table->string('claimed_by_role', 50)->default('satpam');
            $table->string('wifi_ssid', 100)->nullable();
            $table->string('device_token', 100)->nullable();
            $table->string('device_ip', 50)->nullable()->default('192.168.10.1');
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('iot_claims');
        try {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'rw', 'rt', 'warga', 'bendahara', 'sekretaris') DEFAULT 'warga'");
        } catch (\Throwable $e) {
        }
    }
};
