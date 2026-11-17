<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_and_player_login_work(): void
    {
        $this->postJson('/api/register', [
            'name' => 'BrainBuzz Player',
            'email' => 'player@example.test',
            'password' => 'StrongPass123!',
            'password_confirmation' => 'StrongPass123!',
        ])
            ->assertCreated()
            ->assertJsonPath('user.email', 'player@example.test');

        $this->postJson('/api/login', [
            'email' => 'player@example.test',
            'password' => 'StrongPass123!',
        ])
            ->assertOk()
            ->assertJsonStructure([
                'token',
                'user' => ['id', 'name', 'email'],
            ]);

        $this->postJson('/api/login', [
            'email' => 'player@example.test',
            'password' => 'WrongPass123!',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    public function test_password_reset_link_and_reset_work_and_revoke_tokens(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'reset@example.test',
            'is_active' => true,
        ]);
        $user->createToken('existing-session');

        $this->postJson('/api/forgot-password', [
            'email' => $user->email,
        ])
            ->assertOk()
            ->assertJsonPath('message', 'Password reset link sent successfully! Check your email.');

        $token = null;
        Notification::assertSentTo(
            $user,
            ResetPassword::class,
            function (ResetPassword $notification) use (&$token, $user): bool {
                $token = $notification->token;
                $resetUrl = $notification->toMail($user)->actionUrl;
                parse_str((string) parse_url($resetUrl, PHP_URL_QUERY), $query);

                $this->assertSame(
                    '/reset-password',
                    parse_url($resetUrl, PHP_URL_PATH)
                );
                $this->assertSame($token, $query['token'] ?? null);
                $this->assertSame($user->email, $query['email'] ?? null);

                return true;
            }
        );
        $this->assertNotEmpty($token);

        $this->postJson('/api/reset-password', [
            'token' => 'invalid-token',
            'email' => $user->email,
            'password' => 'UpdatedPass123!',
            'password_confirmation' => 'UpdatedPass123!',
        ])->assertStatus(422);

        $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'UpdatedPass123!',
            'password_confirmation' => 'UpdatedPass123!',
        ])
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Password reset successfully! Please login with your new password.'
            );

        $this->assertTrue(Hash::check('UpdatedPass123!', $user->fresh()->password));
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
