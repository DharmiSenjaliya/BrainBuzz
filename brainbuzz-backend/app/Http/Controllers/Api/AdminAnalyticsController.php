<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Question;
use App\Models\Category;
use App\Models\GameResult;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminAnalyticsController extends Controller
{
    public function overview(Request $request)
    {
        $totalPlayers = User::where('is_admin', false)->count();
        $activePlayers = User::where('is_admin', false)->where('is_active', true)->count();
        $totalQuestions = Question::count();
        $activeQuestions = Question::where('is_active', true)->count();
        $totalCategories = Category::count();
        $totalGames = GameResult::count();

        $passedGames = GameResult::where('passed', true)->count();
        $passRate = $totalGames > 0 ? round(($passedGames / $totalGames) * 100, 1) : 0;

        // Games played in last 7 days
        $weeklyActivity = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $dayLabel = now()->subDays($i)->format('D');
            $count = GameResult::whereDate('created_at', $date)->count();
            $weeklyActivity[] = [
                'date' => $date,
                'day' => $dayLabel,
                'count' => $count,
            ];
        }

        // Category distribution
        $categoryStats = Category::withCount('questions')
            ->orderByDesc('questions_count')
            ->limit(6)
            ->get(['id', 'name'])
            ->map(function ($cat) {
                return [
                    'name' => $cat->name,
                    'count' => $cat->questions_count,
                ];
            });

        // Recent game results
        $recentGames = GameResult::with('user:id,name,email')
            ->latest()
            ->limit(5)
            ->get(['id', 'user_id', 'level', 'score', 'passed', 'created_at']);

        return response()->json([
            'success' => true,
            'kpi' => [
                'total_players' => $totalPlayers,
                'active_players' => $activePlayers,
                'total_questions' => $totalQuestions,
                'active_questions' => $activeQuestions,
                'total_categories' => $totalCategories,
                'total_games_played' => $totalGames,
                'pass_rate' => $passRate,
            ],
            'weekly_activity' => $weeklyActivity,
            'category_distribution' => $categoryStats,
            'recent_games' => $recentGames,
        ]);
    }
}
