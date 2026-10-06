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
        Schema::create('letters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('type', ['skck', 'domisili', 'sktm', 'lainnya'])->default('domisili');
            $table->text('purpose');
            $table->enum('status', ['draft', 'submitted', 'rt_approved', 'rw_approved', 'rejected'])->default('submitted');
            $table->foreignId('rt_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('rt_approved_at')->nullable();
            $table->foreignId('rw_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('rw_approved_at')->nullable();
            $table->text('rejected_reason')->nullable();
            $table->string('pdf_path')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('complaints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('category', 50);
            $table->string('title');
            $table->text('description');
            $table->string('photo_path')->nullable();
            $table->enum('status', ['laporan_masuk', 'diproses', 'selesai'])->default('laporan_masuk');
            $table->foreignId('handled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('response_history')->nullable();
            $table->timestamps();
        });

        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->enum('scope', ['rw', 'rt01', 'rt02', 'rt03'])->default('rw');
            $table->string('title');
            $table->longText('content');
            $table->enum('type', ['announcement', 'event'])->default('announcement');
            $table->dateTime('event_date')->nullable();
            $table->boolean('allow_rsvp')->default(false);
            $table->boolean('allow_donation')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('announcement_rsvps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('announcement_id')->constrained('announcements')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('status', ['hadir', 'tidak_hadir'])->default('hadir');
            $table->timestamps();

            $table->unique(['announcement_id', 'user_id']);
        });

        Schema::create('announcement_donations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('announcement_id')->constrained('announcements')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->string('payment_proof')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('announcement_donations');
        Schema::dropIfExists('announcement_rsvps');
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('complaints');
        Schema::dropIfExists('letters');
    }
};
