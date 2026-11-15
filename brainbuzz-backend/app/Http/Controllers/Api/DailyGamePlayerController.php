<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DailyGameChallenge;
use App\Models\DailyGameAttempt;
use App\Models\DailyGameStreak;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DailyGamePlayerController extends Controller
{
    // Get today's published mini game
    public function index(Request $request)
    {
        $today = now('Asia/Kolkata')->toDateString();

        $challenge = DailyGameChallenge::where('challenge_date', $today)
            ->where('status', 'published')
            ->first();

        if (!$challenge) {
            return response()->json([
                'success' => false,
                'message' => 'Today\'s mini game is not available yet.',
            ], 404);
        }

        $attempt = DailyGameAttempt::where(
            'daily_game_challenge_id',
            $challenge->id
        )->where('user_id', $request->user()->id)->first();

        $streak = DailyGameStreak::where(
            'user_id',
            $request->user()->id
        )->first();

        // Never send correct answers to the player before submission
        $content = $challenge->content ?? [];

        $items = collect($content['items'] ?? [])->map(function ($item) {
            unset(
                $item['answer'],
                $item['accepted_answers'],
                $item['correct_answer']
            );

            return $item;
        })->values();

        return response()->json([
            'success' => true,
            'challenge' => [
                'id' => $challenge->id,
                'date' => $today,
                'game_type' => $challenge->game_type,
                'title' => $challenge->title,
                'instructions' => $challenge->instructions,
                'difficulty' => $challenge->difficulty,
                'duration_seconds' => $challenge->duration_seconds,
                'total_points' => $challenge->total_points,
                'bonus_points' => $challenge->bonus_points,
                'items' => $items,
                'is_completed' => (bool) $attempt,
                'attempt' => $attempt ? [
    'score' => $attempt->score,
    'max_score' => $attempt->max_score,
    'correct_answers' => $attempt->correct_answers,
    'wrong_answers' => $attempt->wrong_answers,
    'duration_seconds' => $attempt->duration_seconds,
    'is_completed' => $attempt->is_completed,
    'completed_at' => $attempt->completed_at,
] : null,
            ],
            'streak' => [
                'current_streak' => $streak->current_streak ?? 0,
                'longest_streak' => $streak->longest_streak ?? 0,
                'total_days_played' => $streak->total_days_played ?? 0,
            ],
        ]);
    }

    // Submit and verify daily mini game
    public function submit(Request $request)
    {
        $validated = $request->validate([
            'challenge_id' => 'required|integer|exists:daily_game_challenges,id',
            'answers' => 'required|array|min:1',
            'answers.*.item_id' => 'required|string|max:100|distinct',
            'answers.*.answer' => 'required|string|max:2000',
            'duration_seconds' => 'required|integer|min:0|max:86400',
        ]);

        $user = $request->user();
        $today = now('Asia/Kolkata')->toDateString();

        return DB::transaction(function () use (
            $validated,
            $user,
            $today
        ) {
            $challenge = DailyGameChallenge::where(
                'id',
                $validated['challenge_id']
            )
                ->where('challenge_date', $today)
                ->where('status', 'published')
                ->lockForUpdate()
                ->first();

            if (!$challenge) {
                return response()->json([
                    'success' => false,
                    'message' => 'Daily mini game is unavailable or expired.',
                ], 404);
            }

            // Prevent duplicate attempts
            $existingAttempt = DailyGameAttempt::where(
                'daily_game_challenge_id',
                $challenge->id
            )->where('user_id', $user->id)->first();

            if ($existingAttempt) {
                return response()->json([
                    'success' => false,
                    'message' => 'You have already completed today\'s mini game.',
                    'attempt' => $existingAttempt,
                ], 409);
            }

            $content = $challenge->content ?? [];
            $items = collect($content['items'] ?? []);

            if ($items->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mini game content is not configured correctly.',
                ], 409);
            }

            $expectedIds = $items->pluck('id')
                ->map(fn ($id) => (string) $id)
                ->sort()
                ->values()
                ->toArray();

            $submittedIds = collect($validated['answers'])
                ->pluck('item_id')
                ->sort()
                ->values()
                ->toArray();

            if (
                count($expectedIds) !== $items->count() ||
                count(array_unique($expectedIds)) !== count($expectedIds) ||
                $submittedIds !== $expectedIds
            ) {
                return response()->json([
                    'success' => false,
                    'message' => 'Submitted answers do not match the daily game.',
                ], 422);
            }

            $answers = collect($validated['answers'])->keyBy('item_id');

            $correctAnswers = 0;
            $wrongAnswers = 0;
            $baseScore = 0;
            $results = [];

            foreach ($items as $item) {
                $itemId = (string) $item['id'];
                $submittedAnswer = trim(
                    $answers[$itemId]['answer']
                );

               $correctAnswer = $item['answer'] ?? null;

$isCorrect = (
    $correctAnswer !== null &&
    mb_strtolower(trim((string) $submittedAnswer)) ===
    mb_strtolower(trim((string) $correctAnswer))
);
                $points = max(0, (int) ($item['points'] ?? 0));

                if ($isCorrect) {
                    $correctAnswers++;
                    $baseScore += $points;
                } else {
                    $wrongAnswers++;
                }

                $results[] = [
                    'item_id' => $itemId,
                    'submitted_answer' => $submittedAnswer,
                    'is_correct' => $isCorrect,
                    'correct_answer' => $correctAnswer,
                    'explanation' => $item['explanation'] ?? null,
                    'points_earned' => $isCorrect ? $points : 0,
                ];
            }

            $baseScore = min(
                $baseScore,
                (int) $challenge->total_points
            );

            // Bonus is awarded for completing the daily game
            $bonusPoints = (int) $challenge->bonus_points;
            $totalScore = $baseScore + $bonusPoints;

            $completedAt = now('Asia/Kolkata');

            $attempt = DailyGameAttempt::create([
                'daily_game_challenge_id' => $challenge->id,
                'user_id' => $user->id,
                'score' => $totalScore,
                'max_score' => (int) $challenge->total_points + $bonusPoints,
                'correct_answers' => $correctAnswers,
                'wrong_answers' => $wrongAnswers,
                'duration_seconds' => $validated['duration_seconds'],
                'result_data' => [
                    'game_type' => $challenge->game_type,
                    'base_score' => $baseScore,
                    'bonus_points' => $bonusPoints,
                    'answers' => $results,
                ],
                'is_completed' => true,
                'completed_at' => $completedAt,
            ]);

            // Create or update player streak
            DailyGameStreak::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'current_streak' => 0,
                    'longest_streak' => 0,
                    'total_days_played' => 0,
                ]
            );

            $streak = DailyGameStreak::where('user_id', $user->id)
                ->lockForUpdate()
                ->firstOrFail();

            $yesterday = $completedAt->copy()
                ->subDay()
                ->toDateString();

            $lastPlayed = $streak->last_played_date
                ? $streak->last_played_date->toDateString()
                : null;

            if ($lastPlayed !== $today) {
                if ($lastPlayed === $yesterday) {
                    $streak->current_streak++;
                } else {
                    $streak->current_streak = 1;
                }

                $streak->total_days_played++;
                $streak->last_played_date = $today;
            }

            $streak->longest_streak = max(
                $streak->longest_streak,
                $streak->current_streak
            );

            $streak->save();

            return response()->json([
                'success' => true,
                'message' => 'Daily mini game completed successfully!',
                'result' => [
                    'game_type' => $challenge->game_type,
                    'correct_answers' => $correctAnswers,
                    'wrong_answers' => $wrongAnswers,
                    'base_score' => $baseScore,
                    'bonus_points' => $bonusPoints,
                    'total_score' => $totalScore,
                    'duration_seconds' => $validated['duration_seconds'],
                    'answers' => $results,
                ],
                'streak' => [
                    'current_streak' => $streak->current_streak,
                    'longest_streak' => $streak->longest_streak,
                    'total_days_played' => $streak->total_days_played,
                ],
                'attempt' => $attempt,
            ], 201);
        });
    }

    // Player's mini game history
    public function history(Request $request)
    {
        $userId = $request->user()->id;

        $summary = DailyGameAttempt::where('user_id', $userId)
            ->where('is_completed', true)
            ->selectRaw('
                COUNT(*) as total_games,
                COALESCE(SUM(score), 0) as total_points,
                COALESCE(AVG(score), 0) as average_score
            ')
            ->first();

        $streak = DailyGameStreak::where('user_id', $userId)->first();

        $attempts = DailyGameAttempt::with('challenge:id,challenge_date,game_type,title,difficulty')
            ->where('user_id', $userId)
            ->where('is_completed', true)
            ->latest('completed_at')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'history' => $attempts,
            'summary' => [
                'total_games' => (int) ($summary->total_games ?? 0),
                'total_points' => (int) ($summary->total_points ?? 0),
                'average_score' => round((float) ($summary->average_score ?? 0), 2),
                'current_streak' => (int) ($streak->current_streak ?? 0),
                'longest_streak' => (int) ($streak->longest_streak ?? 0),
                'total_days_played' => (int) ($streak->total_days_played ?? 0),
            ],
        ]);
    }
}
