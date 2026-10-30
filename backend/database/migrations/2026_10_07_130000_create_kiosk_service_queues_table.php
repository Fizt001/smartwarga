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
        Schema::create('kiosk_service_queues', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('queue_number')->default(1);
            $table->date('queue_date')->index();
            $table->string('rfid_uid', 50)->index();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('citizen_name', 150);
            $table->enum('status', ['active', 'waiting', 'completed', 'cancelled'])->default('waiting')->index();
            $table->string('service_type', 100)->nullable(); // registrasi_ktp, posyandu, pengaduan, surat, bank_sampah
            $table->text('service_notes')->nullable();
            $table->timestamp('tapped_at');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kiosk_service_queues');
    }
};

