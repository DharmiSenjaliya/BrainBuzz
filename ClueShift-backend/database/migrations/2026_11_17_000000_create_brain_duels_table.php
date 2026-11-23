<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('brain_duels', function (Blueprint $table) {
            $table->id();
            $table->string('invite_code', 8)->unique();
            $table->foreignId('creator_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('opponent_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('question_ids');
            $table->json('creator_answers')->nullable();
            $table->json('opponent_answers')->nullable();
            $table->unsignedInteger('creator_progress')->default(0);
            $table->unsignedInteger('opponent_progress')->default(0);
            $table->unsignedInteger('creator_score')->default(0);
            $table->unsignedInteger('opponent_score')->default(0);
            $table->unsignedInteger('creator_correct_answers')->default(0);
            $table->unsignedInteger('opponent_correct_answers')->default(0);
            $table->string('status', 20)->default('waiting');
            $table->timestamp('expires_at');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('brain_duels');
    }
};
