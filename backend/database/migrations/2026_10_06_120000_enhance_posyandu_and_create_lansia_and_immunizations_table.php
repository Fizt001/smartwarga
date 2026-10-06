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
        // 1. Tambah Kolom KMS Balita ke posyandu_records
        Schema::table('posyandu_records', function (Blueprint $table) {
            $table->decimal('head_circumference_cm', 5, 2)->nullable()->after('height_cm');
            $table->enum('gender', ['L', 'P'])->default('L')->after('birth_date');
            $table->unsignedSmallInteger('age_months')->nullable()->after('gender');
            $table->enum('kms_status', ['green', 'yellow', 'red'])->default('green')->after('head_circumference_cm');
            $table->string('nutrition_status')->nullable()->after('kms_status');
            $table->boolean('vitamin_a')->default(false)->after('nutrition_status');
            $table->text('notes')->nullable()->after('vitamin_a');
        });

        // 2. Tabel Jadwal & Rekam Imunisasi Balita
        Schema::create('immunization_records', function (Blueprint $table) {
            $table->id();
            $table->string('child_name');
            $table->foreignId('parent_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('vaccine_name');
            $table->unsignedSmallInteger('target_age_months')->default(0);
            $table->date('scheduled_date');
            $table->date('administered_date')->nullable();
            $table->enum('status', ['scheduled', 'completed', 'missed'])->default('scheduled');
            $table->string('batch_number')->nullable();
            $table->foreignId('officer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 3. Tabel Pemantauan Kesehatan Lansia
        Schema::create('elderly_health_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('elderly_name');
            $table->enum('gender', ['L', 'P'])->default('L');
            $table->unsignedSmallInteger('age');
            $table->string('rt_number', 10)->nullable();
            $table->unsignedSmallInteger('systolic');
            $table->unsignedSmallInteger('diastolic');
            $table->string('blood_pressure_status');
            $table->decimal('blood_sugar', 5, 2)->nullable();
            $table->decimal('cholesterol', 5, 2)->nullable();
            $table->decimal('uric_acid', 5, 2)->nullable();
            $table->decimal('weight_kg', 5, 2)->nullable();
            $table->decimal('waist_circumference_cm', 5, 2)->nullable();
            $table->string('risk_assessment')->nullable();
            $table->text('recommendations')->nullable();
            $table->timestamp('examined_at');
            $table->foreignId('officer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('elderly_health_records');
        Schema::dropIfExists('immunization_records');
        Schema::table('posyandu_records', function (Blueprint $table) {
            $table->dropColumn([
                'head_circumference_cm',
                'gender',
                'age_months',
                'kms_status',
                'nutrition_status',
                'vitamin_a',
                'notes',
            ]);
        });
    }
};
