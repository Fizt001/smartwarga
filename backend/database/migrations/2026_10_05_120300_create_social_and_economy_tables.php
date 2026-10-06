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
        Schema::create('posyandu_records', function (Blueprint $table) {
            $table->id();
            $table->string('child_name');
            $table->foreignId('parent_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('birth_date')->nullable();
            $table->decimal('weight_kg', 5, 2);
            $table->decimal('height_cm', 5, 2);
            $table->string('rfid_uid', 50)->nullable();
            $table->timestamp('measured_at');
            $table->foreignId('officer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('rukam_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reported_by')->constrained('users')->cascadeOnDelete();
            $table->string('deceased_name');
            $table->string('deceased_address');
            $table->string('relation', 50);
            $table->string('death_certificate_path')->nullable();
            $table->enum('status', ['reported', 'verified', 'disbursed'])->default('reported');
            $table->decimal('disbursement_amount', 15, 2)->default(0);
            $table->foreignId('disbursed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('disbursed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('waste_bank_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('rfid_uid', 50);
            $table->enum('category', ['kaleng', 'plastik']);
            $table->unsignedInteger('weight_gram');
            $table->decimal('price_per_kg', 10, 2);
            $table->decimal('total_nominal', 15, 2);
            $table->foreignId('wallet_transaction_id')->nullable()->constrained('wallet_transactions')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('category', ['tenda', 'sound_system', 'kursi', 'lainnya'])->default('lainnya');
            $table->unsignedInteger('quantity')->default(1);
            $table->string('condition')->default('baik');
            $table->string('rt_number', 10);
            $table->timestamps();
        });

        Schema::create('asset_loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('quantity')->default(1);
            $table->date('loan_date');
            $table->date('return_date');
            $table->date('actual_return_date')->nullable();
            $table->enum('status', ['requested', 'approved', 'returned', 'rejected'])->default('requested');
            $table->decimal('donation_amount', 15, 2)->default(0);
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('umkm_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->string('category', 50);
            $table->text('description');
            $table->decimal('price', 15, 2);
            $table->string('photo_path')->nullable();
            $table->string('whatsapp_link');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('koperasi_loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->unsignedTinyInteger('tenor_months')->default(6);
            $table->decimal('monthly_installment', 15, 2);
            $table->text('purpose');
            $table->enum('status', ['draft', 'submitted', 'approved', 'disbursed', 'completed', 'rejected'])->default('submitted');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('disbursed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('koperasi_loans');
        Schema::dropIfExists('umkm_products');
        Schema::dropIfExists('asset_loans');
        Schema::dropIfExists('assets');
        Schema::dropIfExists('waste_bank_transactions');
        Schema::dropIfExists('rukam_reports');
        Schema::dropIfExists('posyandu_records');
    }
};
