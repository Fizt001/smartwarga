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
        Schema::table('announcements', function (Blueprint $table) {
            $table->decimal('budget_amount', 15, 2)->nullable()->after('event_date');
            $table->enum('budget_source', ['kas_rt', 'kas_rw', 'swadaya'])->nullable()->after('budget_amount');
            $table->enum('budget_status', ['proposed', 'approved', 'rejected', 'disbursed'])->default('proposed')->after('budget_source');
            $table->foreignId('budget_approved_by')->nullable()->after('budget_status')->constrained('users')->nullOnDelete();
            $table->text('budget_notes')->nullable()->after('budget_approved_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->dropForeign(['budget_approved_by']);
            $table->dropColumn([
                'budget_amount',
                'budget_source',
                'budget_status',
                'budget_approved_by',
                'budget_notes'
            ]);
        });
    }
};
