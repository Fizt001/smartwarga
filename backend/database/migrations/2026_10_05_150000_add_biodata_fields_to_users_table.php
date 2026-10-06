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
        Schema::table('users', function (Blueprint $table) {
            $table->string('birth_place', 100)->nullable()->after('nik');
            $table->date('birth_date')->nullable()->after('birth_place');
            $table->string('gender', 20)->nullable()->after('birth_date'); // 'Laki-laki', 'Perempuan' atau 'L', 'P'
            $table->string('religion', 30)->nullable()->after('gender'); // 'Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'
            $table->string('occupation', 100)->nullable()->after('religion');
            $table->string('marital_status', 30)->nullable()->after('occupation'); // 'Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati'
            $table->string('blood_type', 10)->nullable()->after('marital_status'); // 'A', 'B', 'AB', 'O', '-'
            $table->string('relationship', 50)->nullable()->after('blood_type'); // 'Kepala Keluarga', 'Istri', 'Anak', 'Orang Tua', 'Famili Lain'
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'birth_place',
                'birth_date',
                'gender',
                'religion',
                'occupation',
                'marital_status',
                'blood_type',
                'relationship',
            ]);
        });
    }
};
