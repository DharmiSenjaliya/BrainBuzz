<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GameResult;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

class GameResultController extends Controller
{
    // Save player's game result
   
// Save player's game result and create notification
public function store(Request $request)
{
    $validated = $request->validate([
        'level' => 'required|integer|min:1',
        'score' => 'required|integer|min:0',
        'correct_answers' => 'required|integer|min:0|max:5',
        'wrong_answers' => 'required|integer|min:0|max:5',
        'total_questions' => 'required|integer|min:1|max:5',
        'passed' => 'required|boolean',
    ]);

    if (
        $validated['correct_answers'] + $validated['wrong_answers']
        !== $validated['total_questions']
    ) {
        return response()->json([
            'success' => false,
            'message' => 'Invalid game result.',
        ], 422);
    }

    $user = $request->user();

    $result = GameResult::create([
        ...$validated,
        'user_id' => $user->id,
    ]);

    $status = $result->passed ? 'Level Passed!' : 'Keep Practicing!';

    $user->notifications()->create([
        'id' => (string) \Illuminate\Support\Str::uuid(),
        'type' => 'game',
        'data' => [
            'type' => 'game',
            'title' => $status,
            'message' => "You completed Level {$result->level} with {$result->score} points and {$result->correct_answers} correct answers.",
        ],
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Game result saved successfully!',
        'result' => $result,
    ], 201);
}


    // Player's game history
    public function history(Request $request)
    {
        $results = GameResult::where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'results' => $results,
        ]);
    }

    // Player dashboard statistics
    public function dashboard(Request $request)
    {
        $results = GameResult::where('user_id', $request->user()->id);

        $gamesPlayed = (clone $results)->count();
        $totalScore = (clone $results)->sum('score');
        $dailyBonus = \App\Models\DailyChallengeAttempt::where('user_id', $request->user()->id)
        ->sum('bonus_points');

    $totalScore += $dailyBonus;
        $totalCorrect = (clone $results)->sum('correct_answers');
        $totalWrong = (clone $results)->sum('wrong_answers');
        $totalQuestions = (clone $results)->sum('total_questions');

        $accuracy = $totalQuestions > 0
            ? round(($totalCorrect / $totalQuestions) * 100)
            : 0;

        return response()->json([
            'success' => true,
            'stats' => [
                'games_played' => $gamesPlayed,
                'total_score' => $totalScore,
                'total_correct' => $totalCorrect,
                'total_wrong' => $totalWrong,
                'accuracy' => $accuracy,
            ],
        ]);
    }

    // Leaderboard - All players ranking
    public function leaderboard(Request $request)
    {

    $dailyBonusStats = \App\Models\DailyChallengeAttempt::selectRaw('
    user_id,
    SUM(bonus_points) as daily_bonus
')
->groupBy('user_id');
        $players = User::joinSub(
            GameResult::selectRaw('
                user_id,
                SUM(score) as total_score,
                COUNT(*) as games_played,
                SUM(correct_answers) as total_correct,
                SUM(total_questions) as total_questions
            ')
            ->groupBy('user_id'),
            'game_stats',
            'users.id',
            '=',
            'game_stats.user_id'
        )
        ->leftJoinSub(
    $dailyBonusStats,
    'daily_bonus_stats',
    'users.id',
    '=',
    'daily_bonus_stats.user_id'
)
        ->select(
            'users.id',
            'users.name',
            'game_stats.games_played'
        )
        ->selectRaw('
            game_stats.total_score + COALESCE(daily_bonus_stats.daily_bonus, 0) as total_score
        ')
        ->selectRaw('
            ROUND(
                (game_stats.total_correct / NULLIF(game_stats.total_questions, 0)) * 100,
                1
            ) as accuracy
        ')
        ->orderByDesc('total_score')
        ->orderBy('users.name')
        ->get();

        $leaderboard = $players->values()->map(function ($player, $index) {
            $player->rank = $index + 1;
            return $player;
        });

        $currentPlayer = $leaderboard->firstWhere(
            'id',
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'leaderboard' => $leaderboard,
            'current_user_rank' => $currentPlayer->rank ?? null,
        ]);
    }

    // Player achievements
public function achievements(Request $request)
{
    $userId = $request->user()->id;

    $results = GameResult::where('user_id', $userId)->get();

    $gamesPlayed = $results->count();
    $totalScore = $results->sum('score');

    $completedLevels = $results
        ->where('passed', true)
        ->pluck('level')
        ->unique()
        ->count();

    $perfectGame = $results->contains(function ($result) {
        return $result->total_questions > 0 &&
            $result->correct_answers === $result->total_questions;
    });

    $achievements = [
        [
            'id' => 1,
            'name' => 'First Game',
            'description' => 'Complete your first game.',
            'icon' => '🏅',
            'earned' => $gamesPlayed >= 1,
        ],
        [
            'id' => 2,
            'name' => '5 Games Played',
            'description' => 'Complete 5 games.',
            'icon' => '🎮',
            'earned' => $gamesPlayed >= 5,
        ],
        [
            'id' => 3,
            'name' => '100 Points',
            'description' => 'Earn 100 total points.',
            'icon' => '💯',
            'earned' => $totalScore >= 100,
        ],
        [
            'id' => 4,
            'name' => '500 Points',
            'description' => 'Earn 500 total points.',
            'icon' => '⭐',
            'earned' => $totalScore >= 500,
        ],
        [
            'id' => 5,
            'name' => 'Perfect Game',
            'description' => 'Answer every question correctly in one game.',
            'icon' => '🎯',
            'earned' => $perfectGame,
        ],
        [
            'id' => 6,
            'name' => 'Level 1 Completed',
            'description' => 'Successfully complete Level 1.',
            'icon' => '🥇',
            'earned' => $results->contains(function ($result) {
                return $result->level == 1 && $result->passed;
            }),
        ],
        [
            'id' => 7,
            'name' => '3 Levels Completed',
            'description' => 'Successfully complete 3 different levels.',
            'icon' => '🏆',
            'earned' => $completedLevels >= 3,
        ],
    ];

    return response()->json([
        'success' => true,
        'achievements' => $achievements,
        'earned_count' => collect($achievements)
            ->where('earned', true)
            ->count(),
        'total_achievements' => count($achievements),
    ]);
}

    // Player level-wise progress
    public function levelProgress(Request $request)
    {
        $userId = $request->user()->id;

        $results = GameResult::where('user_id', $userId)
            ->get()
            ->groupBy('level');

        $levels = [];
        $currentLevel = 1;

        for ($level = 1; $level <= 50; $level++) {
            $levelResults = $results->get($level, collect());

            $bestCorrect = $levelResults->max('correct_answers') ?? 0;

            $isCompleted = $levelResults->contains(
                fn ($result) => $result->passed
            );

            $isUnlocked = $level === 1 || $currentLevel >= $level;

            $stars = $bestCorrect >= 5 ? 3 :
                ($bestCorrect >= 4 ? 2 :
                ($bestCorrect >= 3 ? 1 : 0));

            $levels[] = [
                'level' => $level,
                'is_unlocked' => $isUnlocked,
                'is_completed' => $isCompleted,
                'stars' => $stars,
                'best_correct_answers' => $bestCorrect,
            ];

            if ($isCompleted && $level === $currentLevel) {
                $currentLevel++;
            }
        }

        return response()->json([
            'success' => true,
            'current_level' => $currentLevel,
            'levels' => $levels,
        ]);
    }
}
