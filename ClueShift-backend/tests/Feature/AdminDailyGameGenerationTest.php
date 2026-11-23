<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\DailyGameAiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class AdminDailyGameGenerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_receives_an_actionable_ai_generation_error(): void
    {
        $admin = User::factory()->create([
            'is_admin' => true,
            'is_active' => true,
        ]);

        $aiService = Mockery::mock(DailyGameAiService::class);
        $aiService->shouldReceive('generate')
            ->once()
            ->andThrow(new RuntimeException(
                'Gemini quota or rate limit exceeded. Check your Google AI Studio limits and retry later.'
            ));
        $this->app->instance(DailyGameAiService::class, $aiService);

        $this->actingAs($admin)
            ->postJson('/api/admin/daily-mini-games/generate-ai', [
                'challenge_date' => now()->addDay()->toDateString(),
                'game_type' => 'word_shuffle',
            ])
            ->assertStatus(502)
            ->assertJsonPath(
                'message',
                'Gemini quota or rate limit exceeded. Check your Google AI Studio limits and retry later.'
            );
    }
}
