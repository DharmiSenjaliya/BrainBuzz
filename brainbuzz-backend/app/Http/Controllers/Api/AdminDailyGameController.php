<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DailyGameChallenge;
use App\Services\DailyGameAiService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminDailyGameController extends Controller
{
    private function checkAdmin(Request $request)
    {
        if (!$request->user() || !$request->user()->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access required.',
            ], 403);
        }

        return null;
    }

    // Get all daily mini games
    public function index(Request $request)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        $challenges = DailyGameChallenge::withCount('attempts')
            ->with('approver:id,name')
            ->orderByDesc('challenge_date')
            ->get();

        return response()->json([
            'success' => true,
            'challenges' => $challenges,
        ]);
    }

    // Create a daily mini game manually
    public function store(Request $request)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        
$validated = $request->validate([
    'challenge_date' => [
        'required',
        'date',
        'after_or_equal:today',
        'unique:daily_game_challenges,challenge_date',
    ],
    'game_type' => [
        'required',
        Rule::in([
            'word_shuffle',
            'logic_detective',
            'pattern_master',
            'visual_detective',
            'number_ninja',
            'weekend_surprise',
        ]),
    ],
    'title' => 'required|string|max:255',
    'instructions' => 'nullable|string|max:5000',
    'content' => 'required|array',
    'content.items' => 'required|array|min:1|max:20',
    'content.items.*.id' => 'required|string|max:100|distinct',
    'content.items.*.points' => 'required|integer|min:0|max:10000',
    'content.items.*.answer' => 'required|string|max:2000',
    'content.items.*.prompt' => 'nullable|string|max:5000',
    'content.items.*.scrambled_word' => 'nullable|string|max:255',
    'content.items.*.options' => 'nullable|array|max:20',
    'content.items.*.item_type' => 'nullable|in:standard,word_shuffle,logic_detective,pattern_master,visual_detective,number_ninja',
    'content.items.*.clues' => 'nullable|string|max:5000',
    'content.items.*.sequence' => 'nullable|string|max:1000',
    'content.items.*.math_puzzle' => 'nullable|string|max:2000',
    'content.items.*.image_url' => 'nullable|url|max:2048',
    'content.items.*.explanation' => 'nullable|string|max:5000',
    'difficulty' => 'sometimes|in:easy,medium,hard',
    'duration_seconds' => 'sometimes|integer|min:10|max:3600',
    'total_points' => 'sometimes|integer|min:1|max:10000',
    'bonus_points' => 'sometimes|integer|min:0|max:10000',
]);


        $challenge = DailyGameChallenge::create([
            ...$validated,
            'difficulty' => $validated['difficulty'] ?? 'medium',
            'duration_seconds' => $validated['duration_seconds'] ?? 120,
            'total_points' => $validated['total_points'] ?? 100,
            'bonus_points' => $validated['bonus_points'] ?? 20,
            'status' => 'draft',
            'generation_source' => 'manual',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Daily mini game created as draft.',
            'challenge' => $challenge,
        ], 201);
    }


        // Generate a daily mini game using AI
    public function generateWithAi(Request $request, DailyGameAiService $aiService)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        $validated = $request->validate([
            'challenge_date' => 'required|date|after_or_equal:today',
            'game_type' => [
                'required',
                Rule::in([
                    'word_shuffle',
                    'logic_detective',
                    'pattern_master',
                    'visual_detective',
                    'number_ninja',
                    'weekend_surprise',
                ]),
            ],
        ]);

        if (DailyGameChallenge::whereDate(
            'challenge_date',
            $validated['challenge_date']
        )->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'A game already exists for this date.',
            ], 409);
        }

        try {
            $data = $aiService->generate(
                $validated['game_type'],
                $validated['challenge_date']
            );

            $challenge = DailyGameChallenge::create([
                'challenge_date' => $data['challenge_date'],
                'game_type' => $data['game_type'],
                'title' => $data['title'],
                'instructions' => $data['instructions'],
                'content' => ['items' => $data['items']],
                'difficulty' => $data['difficulty'],
                'duration_seconds' => $data['duration_seconds'],
                'total_points' => $data['total_points'],
                'bonus_points' => $data['bonus_points'],
                'status' => 'draft',
                'generation_source' => 'ai',
                'generated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'AI game generated successfully as draft.',
                'challenge' => $challenge,
            ], 201);

        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'AI game generation failed. Please check the AI configuration.',
            ], 502);
        }
    }
    
    // Update a draft or rejected game
    public function update(Request $request, $id)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        $challenge = DailyGameChallenge::findOrFail($id);

        if ($challenge->attempts()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'A game with player attempts cannot be edited.',
            ], 409);
        }

        if (!in_array($challenge->status, ['draft', 'rejected'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Only draft or rejected games can be edited.',
            ], 409);
        }

        
$validated = $request->validate([
    'challenge_date' => [
        'sometimes',
        'required',
        'date',
        'after_or_equal:today',
        Rule::unique('daily_game_challenges', 'challenge_date')
            ->ignore($challenge->id),
    ],
    'game_type' => [
        'sometimes',
        'required',
        Rule::in([
            'word_shuffle',
            'logic_detective',
            'pattern_master',
            'visual_detective',
            'number_ninja',
            'weekend_surprise',
        ]),
    ],
    'title' => 'sometimes|required|string|max:255',
    'instructions' => 'sometimes|nullable|string|max:5000',
    'content' => 'sometimes|required|array',
    'content.items' => 'sometimes|required|array|min:1|max:20',
    'content.items.*.id' => 'required_with:content.items|string|max:100|distinct',
    'content.items.*.points' => 'required_with:content.items|integer|min:0|max:10000',
    'content.items.*.answer' => 'required_with:content.items|string|max:2000',
    'content.items.*.prompt' => 'nullable|string|max:5000',
    'content.items.*.scrambled_word' => 'nullable|string|max:255',
    'content.items.*.options' => 'nullable|array|max:20',
    'content.items.*.item_type' => 'nullable|in:standard,word_shuffle,logic_detective,pattern_master,visual_detective,number_ninja',
    'content.items.*.clues' => 'nullable|string|max:5000',
    'content.items.*.sequence' => 'nullable|string|max:1000',
    'content.items.*.math_puzzle' => 'nullable|string|max:2000',
    'content.items.*.image_url' => 'nullable|url|max:2048',
    'content.items.*.explanation' => 'nullable|string|max:5000',
    'difficulty' => 'sometimes|in:easy,medium,hard',
    'duration_seconds' => 'sometimes|integer|min:10|max:3600',
    'total_points' => 'sometimes|integer|min:1|max:10000',
    'bonus_points' => 'sometimes|integer|min:0|max:10000',
]);


        $challenge->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Daily mini game updated successfully.',
            'challenge' => $challenge->fresh(),
        ]);
    }

    // Submit game for admin approval
    public function submitForApproval(Request $request, $id)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        $challenge = DailyGameChallenge::findOrFail($id);

        if (!in_array($challenge->status, ['draft', 'rejected'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'This game cannot be submitted for approval.',
            ], 409);
        }

        $challenge->update([
            'status' => 'pending_approval',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Game submitted for approval.',
            'challenge' => $challenge->fresh(),
        ]);
    }

    // Approve a game
    public function approve(Request $request, $id)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        $challenge = DailyGameChallenge::findOrFail($id);

        if ($challenge->status !== 'pending_approval') {
            return response()->json([
                'success' => false,
                'message' => 'Only pending games can be approved.',
            ], 409);
        }

        $challenge->update([
            'status' => 'approved',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Daily mini game approved successfully.',
            'challenge' => $challenge->fresh(),
        ]);
    }

    // Reject a game
    public function reject(Request $request, $id)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        $validated = $request->validate([
            'rejection_reason' => 'nullable|string|max:1000',
        ]);

        $challenge = DailyGameChallenge::findOrFail($id);

        if ($challenge->status !== 'pending_approval') {
            return response()->json([
                'success' => false,
                'message' => 'Only pending games can be rejected.',
            ], 409);
        }

        $challenge->update([
            'status' => 'rejected',
            'approved_by' => null,
            'approved_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Daily mini game rejected.',
            'rejection_reason' => $validated['rejection_reason'] ?? null,
            'challenge' => $challenge->fresh(),
        ]);
    }

    // Publish an approved game
    public function publish(Request $request, $id)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        $challenge = DailyGameChallenge::findOrFail($id);

        if ($challenge->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Only approved games can be published.',
            ], 409);
        }

        if ($challenge->challenge_date->toDateString() < now('Asia/Kolkata')->toDateString()) {
            return response()->json([
                'success' => false,
                'message' => 'Past daily games cannot be published.',
            ], 422);
        }


        $items = $challenge->content['items'] ?? [];

if (empty($items)) {
    return response()->json([
        'success' => false,
        'message' => 'Game must contain at least one item before publishing.',
    ], 422);
}

$itemPoints = collect($items)->sum(
    fn ($item) => (int) ($item['points'] ?? 0)
);

if ($itemPoints > (int) $challenge->total_points) {
    return response()->json([
        'success' => false,
        'message' => 'Total item points cannot exceed the game total points.',
        'item_points' => $itemPoints,
        'total_points' => $challenge->total_points,
    ], 422);
}

        $challenge->update([
            'status' => 'published',
            'published_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Daily mini game published successfully!',
            'challenge' => $challenge->fresh(),
        ]);
    }

    // Unpublish a game that has no player attempts
    public function unpublish(Request $request, $id)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        $challenge = DailyGameChallenge::findOrFail($id);

        if ($challenge->status !== 'published') {
            return response()->json([
                'success' => false,
                'message' => 'Only published games can be unpublished.',
            ], 409);
        }

        if ($challenge->attempts()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'A game with player attempts cannot be unpublished.',
            ], 409);
        }

        $challenge->update([
            'status' => 'approved',
            'published_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Daily mini game unpublished successfully.',
            'challenge' => $challenge->fresh(),
        ]);
    }

    // Delete a game that has no player attempts
    public function destroy(Request $request, $id)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        $challenge = DailyGameChallenge::findOrFail($id);

        if ($challenge->attempts()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'A game with player attempts cannot be deleted.',
            ], 409);
        }

        $challenge->delete();

        return response()->json([
            'success' => true,
            'message' => 'Daily mini game deleted successfully.',
        ]);
    }
}
