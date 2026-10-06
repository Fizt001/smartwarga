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
        // 1. Enhance rukam_reports
        Schema::table('rukam_reports', function (Blueprint $table) {
            $table->string('deceased_nik', 30)->nullable()->after('deceased_name');
            $table->date('date_of_death')->nullable()->after('relation');
            $table->string('time_of_death', 20)->nullable()->after('date_of_death');
            $table->string('cause_of_death', 100)->nullable()->after('time_of_death');
            $table->string('burial_location', 150)->nullable()->after('cause_of_death');
            $table->dateTime('burial_datetime')->nullable()->after('burial_location');
            $table->boolean('needs_ambulance')->default(false)->after('death_certificate_path');
            $table->boolean('needs_tent_and_chairs')->default(false)->after('needs_ambulance');
            $table->text('notes')->nullable()->after('needs_tent_and_chairs');
            $table->foreignId('verified_by')->nullable()->after('status')->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable()->after('verified_by');
            $table->string('rejection_reason')->nullable()->after('verified_at');
        });

        // 2. Ambulances fleet
        Schema::create('ambulances', function (Blueprint $table) {
            $table->id();
            $table->string('vehicle_number', 20)->unique();
            $table->string('name', 100);
            $table->enum('type', ['emergency', 'jenazah', 'multipurpose'])->default('multipurpose');
            $table->enum('status', ['available', 'in_service', 'maintenance'])->default('available');
            $table->string('driver_name', 100)->nullable();
            $table->string('driver_phone', 30)->nullable();
            $table->json('equipment')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 3. Ambulance bookings & dispatch
        Schema::create('ambulance_bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_code', 40)->unique();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('ambulance_id')->nullable()->constrained('ambulances')->nullOnDelete();
            $table->foreignId('rukam_report_id')->nullable()->constrained('rukam_reports')->nullOnDelete();
            $table->string('patient_name', 100);
            $table->enum('service_type', ['emergency', 'rujukan', 'jenazah'])->default('emergency');
            $table->enum('urgency_level', ['urgent', 'scheduled'])->default('urgent');
            $table->string('pickup_address');
            $table->string('destination_address');
            $table->dateTime('pickup_time')->nullable();
            $table->text('notes')->nullable();
            $table->string('driver_name', 100)->nullable();
            $table->string('driver_phone', 30)->nullable();
            $table->enum('status', ['requested', 'dispatched', 'completed', 'cancelled'])->default('requested');
            $table->timestamp('dispatched_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('handled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ambulance_bookings');
        Schema::dropIfExists('ambulances');
        Schema::table('rukam_reports', function (Blueprint $table) {
            $table->dropForeign(['verified_by']);
            $table->dropColumn([
                'deceased_nik',
                'date_of_death',
                'time_of_death',
                'cause_of_death',
                'burial_location',
                'burial_datetime',
                'needs_ambulance',
                'needs_tent_and_chairs',
                'notes',
                'verified_by',
                'verified_at',
                'rejection_reason',
            ]);
        });
    }
};
