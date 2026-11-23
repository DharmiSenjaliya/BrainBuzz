<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_challenge_attempts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('daily_challenge_id')
                ->constrained('daily_challenges')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->unsignedInteger('score')->default(0);

            $table->unsignedInteger('correct_answers')->default(0);

            $table->unsignedInteger('wrong_answers')->default(0);

            $table->unsignedInteger('bonus_points')->default(0);

            $table->boolean('is_completed')->default(false);

            $table->timestamp('completed_at')->nullable();

            $table->timestamps();

            // One attempt and one reward per player per challenge
            $table->unique(
                ['daily_challenge_id', 'user_id'],
                'daily_challenge_user_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_challenge_attempts');
    }
};
