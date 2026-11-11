<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminLeaderboardController extends Controller
{
    // Get Admin Leaderboard
    public function index(Request $request)
    {
        if (!$request->user() || !$request->user()->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access required.',
            ], 403);
        }

        // Normal game statistics
        $gameStats = DB::table('game_results')
            ->selectRaw('
                user_id,
                SUM(score) as game_score,
                COUNT(*) as games_played,
                SUM(correct_answers) as correct_answers,
                SUM(wrong_answers) as wrong_answers,
                SUM(total_questions) as total_questions,
                MAX(score) as highest_score,
                SUM(passed) as levels_passed
            ')
            ->groupBy('user_id');

        // Completed daily challenge statistics
        $dailyStats = DB::table('daily_challenge_attempts')
            ->where('is_completed', true)
            ->selectRaw('
                user_id,
                SUM(score) as daily_score,
                COUNT(*) as daily_challenges_played,
                SUM(correct_answers) as daily_correct,
                SUM(wrong_answers) as daily_wrong,
                COUNT(*) * 5 as daily_total_questions,
                MAX(score) as daily_highest_score
            ')
            ->groupBy('user_id');

        // Combine both statistics for every active player
        $query = User::query()
            ->leftJoinSub(
                $gameStats,
                'game_stats',
                'users.id',
                '=',
                'game_stats.user_id'
            )
            ->leftJoinSub(
                $dailyStats,
                'daily_stats',
                'users.id',
                '=',
                'daily_stats.user_id'
            )
            ->where('users.is_admin', false)
            ->where('users.is_active', true)
            ->select(
                'users.id as user_id',
                'users.name',
                'users.email'
            )
            ->selectRaw('
                COALESCE(game_stats.game_score, 0)
                + COALESCE(daily_stats.daily_score, 0)
                as total_score
            ')
            ->selectRaw('
                COALESCE(game_stats.games_played, 0)
                + COALESCE(daily_stats.daily_challenges_played, 0)
                as games_played
            ')
            ->selectRaw('
                COALESCE(game_stats.correct_answers, 0)
                + COALESCE(daily_stats.daily_correct, 0)
                as correct_answers
            ')
            ->selectRaw('
                COALESCE(game_stats.wrong_answers, 0)
                + COALESCE(daily_stats.daily_wrong, 0)
                as wrong_answers
            ')
            ->selectRaw('
                COALESCE(game_stats.total_questions, 0)
                + COALESCE(daily_stats.daily_total_questions, 0)
                as total_questions
            ')
            ->selectRaw('
                GREATEST(
                    COALESCE(game_stats.highest_score, 0),
                    COALESCE(daily_stats.daily_highest_score, 0)
                ) as highest_score
            ')
            ->selectRaw('
                COALESCE(game_stats.levels_passed, 0) as levels_passed
            ');

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('users.name', 'like', "%{$search}%")
                    ->orWhere('users.email', 'like', "%{$search}%");
            });
        }

        $players = $query
            ->orderByDesc('total_score')
            ->orderByDesc('correct_answers')
            ->get();

        $players = $players->values()->map(function ($player, $index) {
            $player->rank = $index + 1;

            $player->accuracy = $player->total_questions > 0
                ? round(
                    ($player->correct_answers / $player->total_questions) * 100,
                    2
                )
                : 0;

            return $player;
        });

        return response()->json([
            'success' => true,
            'leaderboard' => $players,
            'total_players' => $players->count(),
        ]);
    }
}
