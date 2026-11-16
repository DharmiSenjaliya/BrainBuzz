<?php

namespace Tests\Feature;

use App\Models\DailyChallenge;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDailyChallengeCommentTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_save_and_clear_an_internal_comment(): void
    {
        $admin = User::factory()->create([
            'is_admin' => true,
            'is_active' => true,
        ]);
        $challenge = $this->createChallenge();

        $this->actingAs($admin)
            ->patchJson("/api/admin/daily-challenges/{$challenge->id}/comment", [
                'admin_comment' => 'Review the question difficulty.',
            ])
            ->assertOk()
            ->assertJsonPath(
                'challenge.admin_comment',
                'Review the question difficulty.'
            );

        $this->actingAs($admin)
            ->patchJson("/api/admin/daily-challenges/{$challenge->id}/comment", [
                'admin_comment' => null,
            ])
            ->assertOk()
            ->assertJsonPath('challenge.admin_comment', null);

        $this->assertDatabaseHas('daily_challenges', [
            'id' => $challenge->id,
            'admin_comment' => null,
        ]);
    }

    public function test_non_admin_cannot_write_a_daily_challenge_comment(): void
    {
        $player = User::factory()->create(['is_admin' => false]);
        $challenge = $this->createChallenge();

        $this->actingAs($player)
            ->patchJson("/api/admin/daily-challenges/{$challenge->id}/comment", [
                'admin_comment' => 'Player should not be able to write this.',
            ])
            ->assertForbidden();
    }

    private function createChallenge(): DailyChallenge
    {
        return DailyChallenge::create([
            'challenge_date' => '2026-11-20',
            'question_ids' => [1, 2, 3, 4, 5],
            'bonus_points' => 50,
            'is_active' => true,
        ]);
    }
}
