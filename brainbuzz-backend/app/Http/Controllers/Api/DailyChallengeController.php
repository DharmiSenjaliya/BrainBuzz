<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DailyChallenge;
use App\Models\DailyChallengeAttempt;
use App\Models\DailyChallengeStreak;
use App\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DailyChallengeController extends Controller
{
    // Get today's challenge
    public function index(Request $request)
    {
$today = now('Asia/Kolkata')->toDateString();
        $challenge = DailyChallenge::where('challenge_date', $today)
            ->where('is_active', true)
            ->first();

        // Automatically create today's challenge if admin has not created one
        if (!$challenge) {
            $questionIds = Question::where('is_active', true)
                ->inRandomOrder()
                ->limit(5)
                ->pluck('id')
                ->toArray();

            if (count($questionIds) < 5) {
                return response()->json([
                    'success' => false,
                    'message' => 'Daily Challenge is not available. At least 5 active questions are required.',
                ], 404);
            }

            $challenge = DailyChallenge::firstOrCreate(
                ['challenge_date' => $today],
                [
                    'question_ids' => $questionIds,
                    'bonus_points' => 50,
                    'is_active' => true,
                ]
            );
        }

        $questions = Question::whereIn(
            'id',
            $challenge->question_ids
        )->get([
            'id',
            'title',
            'clues',
            'hint',
            'level',
            'points',
        ])->sortBy(function ($question) use ($challenge) {
            return array_search(
                $question->id,
                $challenge->question_ids
            );
        })->values();

        if ($questions->count() !== 5) {
            return response()->json([
                'success' => false,
                'message' => 'Some challenge questions are unavailable.',
            ], 409);
        }

        $attempt = DailyChallengeAttempt::where(
            'daily_challenge_id',
            $challenge->id
        )->where('user_id', $request->user()->id)->first();

        $streak = DailyChallengeStreak::where(
            'user_id',
            $request->user()->id
        )->first();

        return response()->json([
            'success' => true,
            'challenge' => [
                'id' => $challenge->id,
                'date' => $today,
                'total_questions' => 5,
                'bonus_points' => $challenge->bonus_points,
                'is_completed' => (bool) $attempt,
                'attempt' => $attempt,
                'questions' => $questions,
            ],
            'streak' => [
                'current_streak' => $streak->current_streak ?? 0,
                'longest_streak' => $streak->longest_streak ?? 0,
            ],
        ]);
    }

    // Submit and verify all daily challenge answers
    public function submit(Request $request)
    {
        $validated = $request->validate([
            'challenge_id' => 'required|integer|exists:daily_challenges,id',
            'answers' => 'required|array|size:5',
            'answers.*.question_id' => 'required|integer|distinct',
            'answers.*.answer' => 'required|string|max:255',
        ]);

        $user = $request->user();

$today = now('Asia/Kolkata')->toDateString();
        return DB::transaction(function () use (
            $validated,
            $user,
            $today
        ) {
            $challenge = DailyChallenge::where('id', $validated['challenge_id'])
                ->where('challenge_date', $today)
                ->where('is_active', true)
                ->lockForUpdate()
                ->first();

            if (!$challenge) {
                return response()->json([
                    'success' => false,
                    'message' => 'Daily Challenge is unavailable or expired.',
                ], 404);
            }

            // Prevent duplicate attempts and rewards
            $existingAttempt = DailyChallengeAttempt::where(
                'daily_challenge_id',
                $challenge->id
            )->where('user_id', $user->id)->first();

            if ($existingAttempt) {
                return response()->json([
                    'success' => false,
                    'message' => 'You have already completed today\'s challenge.',
                    'attempt' => $existingAttempt,
                ], 409);
            }

            $questionIds = $challenge->question_ids;

            $submittedIds = collect($validated['answers'])
                ->pluck('question_id')
                ->sort()
                ->values()
                ->toArray();

            $expectedIds = collect($questionIds)
                ->sort()
                ->values()
                ->toArray();

            if ($submittedIds !== $expectedIds) {
                return response()->json([
                    'success' => false,
                    'message' => 'Submitted questions do not match today\'s challenge.',
                ], 422);
            }

            $questions = Question::whereIn('id', $questionIds)
                ->get()
                ->keyBy('id');

            if ($questions->count() !== 5) {
                return response()->json([
                    'success' => false,
                    'message' => 'Challenge questions are unavailable.',
                ], 409);
            }

            $correctAnswers = 0;
            $baseScore = 0;

            foreach ($validated['answers'] as $submittedAnswer) {
                $question = $questions->get(
                    $submittedAnswer['question_id']
                );

                $playerAnswer = mb_strtolower(
                    trim($submittedAnswer['answer'])
                );

                $correctAnswer = mb_strtolower(
                    trim($question->answer)
                );

                if ($playerAnswer === $correctAnswer) {
                    $correctAnswers++;
                    $baseScore += (int) $question->points;
                }
            }

            $wrongAnswers = 5 - $correctAnswers;

            // All five answers submitted = challenge completed
            $bonusPoints = (int) $challenge->bonus_points;

            $totalScore = $baseScore + $bonusPoints;

            $completedAt = now('Asia/Kolkata');

            $attempt = DailyChallengeAttempt::create([
                'daily_challenge_id' => $challenge->id,
                'user_id' => $user->id,
                'score' => $totalScore,
                'correct_answers' => $correctAnswers,
                'wrong_answers' => $wrongAnswers,
                'bonus_points' => $bonusPoints,
                'is_completed' => true,
                'completed_at' => $completedAt,
            ]);

            // Update daily completion streak
            $streak = DailyChallengeStreak::firstOrNew([
                'user_id' => $user->id,
            ]);

            $yesterday = $completedAt->copy()
                ->subDay()
                ->toDateString();

            $lastCompleted = $streak->last_completed_date
                ? $streak->last_completed_date->toDateString()
                : null;

            if ($lastCompleted === $yesterday) {
                $streak->current_streak++;
            } elseif ($lastCompleted !== $today) {
                $streak->current_streak = 1;
            }

            $streak->longest_streak = max(
                $streak->longest_streak,
                $streak->current_streak
            );

            $streak->last_completed_date = $today;
            $streak->save();

            // Create completion notification
            $user->notifications()->create([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'type' => 'daily_challenge',
                'data' => [
                    'type' => 'daily_challenge',
                    'title' => 'Daily Challenge Completed!',
                    'message' => "You earned {$totalScore} points, including {$bonusPoints} bonus points. Current streak: {$streak->current_streak} days.",
                ],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Daily Challenge completed successfully!',
                'result' => [
                    'correct_answers' => $correctAnswers,
                    'wrong_answers' => $wrongAnswers,
                    'base_score' => $baseScore,
                    'bonus_points' => $bonusPoints,
                    'total_score' => $totalScore,
                    'is_completed' => true,
                ],
                'streak' => [
                    'current_streak' => $streak->current_streak,
                    'longest_streak' => $streak->longest_streak,
                ],
                'attempt' => $attempt,
            ], 201);
        });
    }

    // Player's previous daily challenges
    public function history(Request $request)
    {
        $summary = DailyChallengeAttempt::where('user_id', $request->user()->id)
    ->where('is_completed', true)
    ->selectRaw('
        COUNT(*) as total_challenges,
        COALESCE(SUM(score), 0) as total_points,
        COALESCE(SUM(bonus_points), 0) as total_bonus
    ')
    ->first();

$streak = DailyChallengeStreak::where(
    'user_id',
    $request->user()->id
)->first();
        $attempts = DailyChallengeAttempt::with('challenge')
            ->where('user_id', $request->user()->id)
            ->where('is_completed', true)
            ->latest('completed_at')
            ->paginate(20);

        return response()->json([
    'success' => true,
    'history' => $attempts,
    'summary' => [
        'total_challenges' => (int) ($summary->total_challenges ?? 0),
        'total_points' => (int) ($summary->total_points ?? 0),
        'total_bonus' => (int) ($summary->total_bonus ?? 0),
        'best_streak' => (int) ($streak->longest_streak ?? 0),
    ],
]);
    }
}
