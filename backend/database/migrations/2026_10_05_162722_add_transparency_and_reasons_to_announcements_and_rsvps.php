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
            if (!Schema::hasColumn('announcements', 'actual_spent')) {
                $table->decimal('actual_spent', 15, 2)->default(0)->after('budget_notes');
            }
            if (!Schema::hasColumn('announcements', 'extra_fee_per_family')) {
                $table->decimal('extra_fee_per_family', 15, 2)->default(0)->after('actual_spent');
            }
            if (!Schema::hasColumn('announcements', 'donation_target')) {
                $table->decimal('donation_target', 15, 2)->nullable()->after('extra_fee_per_family');
            }
            if (!Schema::hasColumn('announcements', 'financial_report_notes')) {
                $table->text('financial_report_notes')->nullable()->after('donation_target');
            }
        });

        Schema::table('announcement_rsvps', function (Blueprint $table) {
            if (!Schema::hasColumn('announcement_rsvps', 'reason')) {
                $table->string('reason')->nullable()->after('status');
            }
            if (!Schema::hasColumn('announcement_rsvps', 'contribution_note')) {
                $table->string('contribution_note')->nullable()->after('reason');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    }
};
