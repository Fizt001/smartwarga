<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ronda_schedules', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->enum('shift', ['malam', 'pagi'])->default('malam');
            $table->json('assigned_users');
            $table->string('rt_number', 10);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('ronda_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schedule_id')->nullable()->constrained('ronda_schedules')->nullOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('rfid_uid', 50);
            $table->string('post_id', 50)->default('POS_01');
            $table->timestamp('tapped_at');
            $table->enum('status', ['hadir', 'terlambat', 'absen'])->default('hadir');
            $table->timestamps();
        });

        Schema::create('iot_devices', function (Blueprint $table) {
            $table->id();
            $table->string('device_key', 64)->unique();
            $table->enum('device_type', ['gate', 'siren', 'waste_terminal']);
            $table->string('location', 100);
            $table->timestamp('last_ping')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('iot_emergency_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->nullable()->constrained('iot_devices')->nullOnDelete();
            $table->string('location');
            $table->string('trigger_type', 50)->default('hardware_button');
            $table->foreignId('handled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['active', 'handled'])->default('active');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });

        Schema::create('siren_statuses', function (Blueprint $table) {
            $table->id();
            $table->boolean('is_active')->default(false);
            $table->foreignId('activated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('activated_at')->nullable();
            $table->string('reason')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('siren_statuses');
        Schema::dropIfExists('iot_emergency_logs');
        Schema::dropIfExists('iot_devices');
        Schema::dropIfExists('ronda_logs');
        Schema::dropIfExists('ronda_schedules');
    }
};
