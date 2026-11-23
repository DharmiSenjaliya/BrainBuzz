<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SuperAdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->is_admin || !$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Active Super Admin account required.',
            ], 403);
        }

        return $next($request);
    }
}