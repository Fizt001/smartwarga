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
        Schema::table('houses', function (Blueprint $table) {
            $table->string('house_code', 25)->nullable()->after('id');
            $table->foreignId('head_of_family_id')->nullable()->after('is_occupied')->constrained('users')->nullOnDelete();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->enum('kk_type', ['kk_utama', 'kk_pendukung', 'anggota'])->default('kk_utama')->after('role');
            $table->string('no_kk', 25)->nullable()->after('kk_type');
            $table->string('nik', 25)->nullable()->after('no_kk');
            $table->boolean('is_head_of_house')->default(false)->after('nik');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['kk_type', 'no_kk', 'nik', 'is_head_of_house']);
        });

        Schema::table('houses', function (Blueprint $table) {
            $table->dropForeign(['head_of_family_id']);
            $table->dropColumn(['house_code', 'head_of_family_id']);
        });
    }
};
