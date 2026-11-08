<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GameResult;
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

        $query = GameResult::query()
            ->join('users', 'game_results.user_id', '=', 'users.id')
            ->where('users.is_admin', false)
            ->where('users.is_active', true)
            ->select(
                'users.id as user_id',
                'users.name',
                'users.email',
                DB::raw('SUM(game_results.score) as total_score'),
                DB::raw('COUNT(game_results.id) as games_played'),
                DB::raw('SUM(game_results.correct_answers) as correct_answers'),
                DB::raw('SUM(game_results.wrong_answers) as wrong_answers'),
                DB::raw('SUM(game_results.total_questions) as total_questions'),
                DB::raw('MAX(game_results.score) as highest_score'),
                DB::raw('SUM(game_results.passed) as levels_passed')
            )
            ->groupBy('users.id', 'users.name', 'users.email');

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