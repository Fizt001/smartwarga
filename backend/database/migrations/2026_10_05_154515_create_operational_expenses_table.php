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
        Schema::create('operational_expenses', function (Blueprint $table) {
            $table->id();
            $table->enum('level', ['rt', 'rw'])->default('rw');
            $table->string('rt_number', 10)->nullable(); // null for RW level
            $table->enum('category', [
                'gaji_satpam',
                'uang_sampah',
                'kebersihan_lingkungan',
                'listrik_iot_fasum',
                'honor_operasional',
                'perawatan_fasum',
                'lainnya'
            ]);
            $table->string('title');
            $table->string('recipient_name');
            $table->string('recipient_role')->nullable();
            $table->decimal('amount', 15, 2);
            $table->unsignedTinyInteger('period_month');
            $table->unsignedSmallInteger('period_year');
            $table->date('payment_date')->nullable();
            $table->string('payment_method')->default('transfer');
            $table->enum('status', ['draft', 'approved', 'paid'])->default('draft');
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('disbursed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->string('proof_path')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('operational_expenses');
    }
};
