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
        Schema::create('ipl_masters', function (Blueprint $table) {
            $table->id();
            $table->string('rt_number', 10);
            $table->unsignedTinyInteger('period_month');
            $table->unsignedSmallInteger('period_year');
            $table->decimal('base_ipl_amount', 15, 2)->default(0);
            $table->decimal('rw_contribution_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['rt_number', 'period_month', 'period_year']);
        });

        Schema::create('ipl_billings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ipl_master_id')->constrained('ipl_masters')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('house_id')->constrained('houses')->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->enum('status', ['unpaid', 'waiting_verification', 'paid'])->default('unpaid');
            $table->enum('payment_method', ['wallet', 'transfer', 'qris'])->nullable();
            $table->string('payment_proof_path')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        Schema::create('wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->decimal('balance', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wallet_id')->constrained('wallets')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('type', ['credit', 'debit']);
            $table->enum('category', [
                'topup',
                'ipl_payment',
                'waste_bank',
                'loan_disbursement',
                'loan_repayment',
                'donation'
            ]);
            $table->decimal('amount', 15, 2);
            $table->string('reference_id')->nullable();
            $table->text('description')->nullable();
            $table->enum('status', ['pending', 'completed', 'rejected'])->default('completed');
            $table->string('proof_path')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('wallets');
        Schema::dropIfExists('ipl_billings');
        Schema::dropIfExists('ipl_masters');
    }
};
