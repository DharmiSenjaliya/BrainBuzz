<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_game_attempts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('daily_game_challenge_id')
                ->constrained('daily_game_challenges')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Player performance
            $table->unsignedInteger('score')->default(0);
            $table->unsignedInteger('max_score')->default(100);
            $table->unsignedInteger('correct_answers')->default(0);
            $table->unsignedInteger('wrong_answers')->default(0);

            // Time taken
            $table->unsignedInteger('duration_seconds')->default(0);

            // Flexible game result data
            $table->json('result_data')->nullable();

            // Completion status
            $table->boolean('is_completed')->default(false);
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();

            // One completed attempt per player per daily challenge
            $table->unique(
                ['daily_game_challenge_id', 'user_id'],
                'daily_game_attempt_user_unique'
            );

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_game_attempts');
    }
};
