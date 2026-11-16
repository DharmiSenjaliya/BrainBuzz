<?php

namespace Tests\Feature;

use App\Models\DailyGameChallenge;
use App\Models\User;
use App\Services\DailyGameAiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Mockery;
use Tests\TestCase;

class RotateDailyGameTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_it_generates_and_publishes_the_daily_game(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-16 00:05:00', 'Asia/Kolkata'));

        $aiService = Mockery::mock(DailyGameAiService::class);
        $aiService->shouldReceive('generate')
            ->once()
            ->with('word_shuffle', '2026-11-16')
            ->andReturn([
                'challenge_date' => '2026-11-16',
                'game_type' => 'word_shuffle',
                'title' => 'Daily Word Shuffle',
                'instructions' => 'Unscramble each word.',
                'items' => array_map(
                    fn (int $index): array => [
                        'id' => 'item-' . $index,
                        'scrambled_word' => 'ELAP',
                        'answer' => 'PALE',
                        'points' => 20,
                        'explanation' => 'Rearrange the letters to spell PALE.',
                    ],
                    range(1, 5)
                ),
                'difficulty' => 'medium',
                'duration_seconds' => 120,
                'total_points' => 100,
                'bonus_points' => 20,
            ]);

        $this->app->instance(DailyGameAiService::class, $aiService);

        $this->artisan('app:rotate-daily-game')
            ->expectsOutput('AI game generated and published successfully.')
            ->assertExitCode(0);

        $challenge = DailyGameChallenge::query()
            ->whereDate('challenge_date', '2026-11-16')
            ->firstOrFail();

        $this->assertSame('published', $challenge->status);
        $this->assertSame('ai', $challenge->generation_source);
        $this->assertNotNull($challenge->generated_at);
        $this->assertNotNull($challenge->published_at);
        $this->assertNull($challenge->approved_by);

        $player = User::factory()->create();

        $this->actingAs($player)
            ->getJson('/api/daily-mini-game')
            ->assertOk()
            ->assertJsonPath('challenge.title', 'Daily Word Shuffle')
            ->assertJsonCount(5, 'challenge.items')
            ->assertJsonMissingPath('challenge.items.0.answer');

        $this->actingAs($player)
            ->postJson('/api/daily-mini-game/submit', [
                'challenge_id' => $challenge->id,
                'answers' => array_map(
                    fn (int $index): array => [
                        'item_id' => 'item-' . $index,
                        'answer' => 'PALE',
                    ],
                    range(1, 5)
                ),
                'duration_seconds' => 20,
            ])
            ->assertCreated()
            ->assertJsonPath('result.correct_answers', 5)
            ->assertJsonPath('result.total_score', 120);
    }

    public function test_it_does_not_replace_a_game_that_already_exists_for_today(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-16 00:05:00', 'Asia/Kolkata'));

        DailyGameChallenge::create([
            'challenge_date' => '2026-11-16',
            'game_type' => 'word_shuffle',
            'title' => 'Existing game',
            'content' => ['items' => []],
            'status' => 'draft',
            'generation_source' => 'manual',
        ]);

        $this->assertSame('2026-11-16', now('Asia/Kolkata')->toDateString());
        $this->assertTrue(
            DailyGameChallenge::query()
                ->whereDate('challenge_date', '2026-11-16')
                ->exists()
        );

        $aiService = Mockery::mock(DailyGameAiService::class);
        $aiService->shouldNotReceive('generate');
        $this->app->instance(DailyGameAiService::class, $aiService);

        $this->artisan('app:rotate-daily-game')
            ->assertExitCode(0);

        $this->assertSame(1, DailyGameChallenge::query()->count());
        $this->assertSame(
            'draft',
            DailyGameChallenge::query()->firstOrFail()->status
        );
    }
}
