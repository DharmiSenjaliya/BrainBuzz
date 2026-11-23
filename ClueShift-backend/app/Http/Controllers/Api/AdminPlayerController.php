<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class AdminPlayerController extends Controller
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

    // Get all registered players
    public function index(Request $request)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        $query = User::where('is_admin', false);

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'success' => true,
            'players' => $query->latest()->get([
                'id',
                'name',
                'email',
                'phone',
                'profile_image',
                'is_active',
                'created_at',
            ]),
            'total' => User::where('is_admin', false)->count(),
            'active' => User::where('is_admin', false)->where('is_active', true)->count(),
            'inactive' => User::where('is_admin', false)->where('is_active', false)->count(),
        ]);
    }

    // Activate or deactivate player
public function updateStatus(Request $request, $id)
{
    if ($error = $this->checkAdmin($request)) {
        return $error;
    }

    $request->validate([
        'is_active' => 'required|boolean',
    ]);

    $player = User::where('is_admin', false)->findOrFail($id);

    $player->is_active = $request->boolean('is_active');
    $player->save();

    // Revoke all player tokens when account is deactivated
    if (!$player->is_active) {
        $player->tokens()->delete();
    }

    return response()->json([
        'success' => true,
        'message' => $player->is_active
            ? 'Player account activated successfully.'
            : 'Player account deactivated successfully.',
    ]);
}

    // Delete player
    public function destroy(Request $request, $id)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        $player = User::where('is_admin', false)->findOrFail($id);

        $player->tokens()->delete();
        $player->delete();

        return response()->json([
            'success' => true,
            'message' => 'Player deleted successfully.',
        ]);
    }
}
