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
            if (!Schema::hasColumn('users', 'coins')) {
                $table->unsignedBigInteger('coins')->default(100)->after('profile_image');
            }
            if (!Schema::hasColumn('users', 'hints')) {
                $table->unsignedInteger('hints')->default(3)->after('coins');
            }
            if (!Schema::hasColumn('users', 'lifelines')) {
                $table->unsignedInteger('lifelines')->default(2)->after('hints');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['coins', 'hints', 'lifelines']);
        });
    }
};
