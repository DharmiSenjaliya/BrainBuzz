<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\QuestionController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\GameResultController;
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\Api\AdminFeedbackController;
use App\Http\Controllers\Api\AdminPlayerController;
use App\Http\Controllers\Api\AdminLeaderboardController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\DailyChallengeController;
use App\Http\Controllers\Api\AdminDailyChallengeController;
use App\Http\Controllers\Api\CategoryController;

// Public Authentication Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/admin/login', [AuthController::class, 'adminLogin']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Protected Player Routes
Route::middleware('auth:sanctum')->group(function () {
    // Game Results & Dashboard
    Route::post('/game-results', [GameResultController::class, 'store']);

    Route::get('/dashboard', [GameResultController::class, 'dashboard']);
    Route::get('/level-progress', [GameResultController::class, 'levelProgress']);

    Route::get('/game-history', [GameResultController::class, 'history']);
Route::get('/leaderboard', [GameResultController::class, 'leaderboard']);
Route::get('/achievements', [GameResultController::class, 'achievements']);


    Route::post('/logout', [AuthController::class, 'logout']);
Route::post('/change-password', [AuthController::class, 'changePassword']);

    Route::get('/me', [AuthController::class, 'me']);

    Route::post('/profile/update', [ProfileController::class, 'update']);

    Route::get('/questions', [QuestionController::class, 'index']);
Route::post('/check-answer', [QuestionController::class, 'checkAnswer']);

    Route::post('/questions', [QuestionController::class, 'store']);

    Route::get('/admin/questions', [QuestionController::class, 'adminIndex']);

    Route::put('/questions/{question}', [QuestionController::class, 'update']);

    Route::delete('/questions/{question}', [QuestionController::class, 'destroy']);
    Route::post('/feedback', [FeedbackController::class, 'store']);
    Route::get('/admin/feedback', [AdminFeedbackController::class, 'index']);
Route::delete('/admin/feedback/{id}', [AdminFeedbackController::class, 'destroy']);
    // Admin Player Management
    Route::get('/admin/players', [AdminPlayerController::class, 'index']);
    Route::put('/admin/players/{id}/status', [AdminPlayerController::class, 'updateStatus']);
    Route::delete('/admin/players/{id}', [AdminPlayerController::class, 'destroy']);
    // Admin Leaderboard
Route::get('/admin/leaderboard', [AdminLeaderboardController::class, 'index']);

   // Admin Daily Challenge Management
Route::get('/admin/daily-challenges', [AdminDailyChallengeController::class, 'index']);

Route::post('/admin/daily-challenges', [AdminDailyChallengeController::class, 'store']);

Route::put('/admin/daily-challenges/{id}', [AdminDailyChallengeController::class, 'update']);

Route::delete('/admin/daily-challenges/{id}', [AdminDailyChallengeController::class, 'destroy']);
// Player Notifications
Route::get('/notifications', [NotificationController::class, 'index']);
Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

// Daily Challenge
Route::get('/daily-challenge', [DailyChallengeController::class, 'index']);
Route::post('/daily-challenge/submit', [DailyChallengeController::class, 'submit']);
Route::get('/daily-challenge/history', [DailyChallengeController::class, 'history']);


// Player Categories
Route::get('/categories', [CategoryController::class, 'playerIndex']);

// Category Management
Route::get('/admin/categories', [CategoryController::class, 'index']);
Route::post('/admin/categories', [CategoryController::class, 'store']);
Route::put('/admin/categories/{category}', [CategoryController::class, 'update']);
Route::delete('/admin/categories/{category}', [CategoryController::class, 'destroy']);
});