<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Password;

class AuthController extends Controller
{
    // Player Registration
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'message' => 'Registration successful!',
            'user' => $user,
        ], 201);
    }

    // Player Login
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid email or password.'],
            ]);
        }

        if ($user->is_admin) {
            return response()->json([
                'message' => 'Please use the admin login.',
            ], 403);
        }

        $token = $user->createToken('brainbuzz-player')->plainTextToken;

        return response()->json([
            'message' => 'Login successful!',
            'token' => $token,
            'user' => $user,
        ]);
    }

    // Admin Login
public function adminLogin(Request $request)
{
    $validated = $request->validate([
        'email' => 'required|email',
        'password' => 'required|string',
    ]);

    $user = User::where('email', $validated['email'])->first();

    if (!$user || !Hash::check($validated['password'], $user->password)) {
        return response()->json([
            'message' => 'Invalid email or password.',
        ], 401);
    }

    if (!$user->is_admin) {
        return response()->json([
            'message' => 'Access denied. Admin account required.',
        ], 403);
    }

    $token = $user->createToken('brainbuzz-admin')->plainTextToken;

    return response()->json([
        'message' => 'Admin login successful!',
        'token' => $token,
        'user' => $user,
    ]);
}

    // Change Player Password
    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is incorrect.'],
            ]);
        }

        $user->password = Hash::make($validated['new_password']);
        $user->save();

        return response()->json([
            'message' => 'Password changed successfully!',
        ]);
    }
 
 // Forgot Password
public function forgotPassword(Request $request)
{
    $request->validate([
        'email' => 'required|email|exists:users,email',
    ]);

    $status = Password::sendResetLink(
        $request->only('email')
    );

    if ($status !== Password::RESET_LINK_SENT) {
        return response()->json([
            'message' => __($status),
        ], 422);
    }

    return response()->json([
        'message' => 'Password reset link sent successfully! Check your email.',
    ]);
}

// Reset Password
public function resetPassword(Request $request)
{
    $validated = $request->validate([
        'token' => 'required|string',
        'email' => 'required|email',
        'password' => 'required|string|min:8|confirmed',
    ]);

    $status = Password::reset(
        $validated,
        function ($user, $password) {
            $user->password = $password;
            $user->save();

            $user->tokens()->delete();
        }
    );

    if ($status !== Password::PASSWORD_RESET) {
        return response()->json([
            'message' => __($status),
        ], 422);
    }

    return response()->json([
        'message' => 'Password reset successfully! Please login with your new password.',
    ]);
}    

    // Player Logout
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout successful!',
        ]);
    }

    // Logged-in User
    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }
}
