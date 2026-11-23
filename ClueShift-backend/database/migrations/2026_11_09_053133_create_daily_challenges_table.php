<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_challenges', function (Blueprint $table) {
            $table->id();

            $table->date('challenge_date')->unique();

            $table->json('question_ids');

            $table->unsignedInteger('bonus_points')->default(50);

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index(['challenge_date', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_challenges');
    }
};
