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
        Schema::create('posyandu_queues', function (Blueprint $table) {
            $table->id();
            $table->string('queue_number', 20); // e.g. A-001, B-001
            $table->date('queue_date')->index();
            $table->enum('category', ['balita', 'lansia', 'umum'])->default('balita');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('rfid_uid', 50)->nullable()->index();
            $table->string('patient_name', 150);
            $table->string('patient_age', 50)->nullable();
            $table->text('complaint')->nullable(); // Keluhan / tujuan pemeriksaan
            $table->enum('status', ['waiting', 'calling', 'completed', 'cancelled'])->default('waiting')->index();
            $table->timestamp('called_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('officer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('posyandu_queues');
    }
};

