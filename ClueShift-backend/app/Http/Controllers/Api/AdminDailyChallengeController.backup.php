<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
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

    // Get all categories
    public function index(Request $request)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        $categories = Category::withCount('questions')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'categories' => $categories,
        ]);
    }

    // Create category
    public function store(Request $request)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'is_active' => 'sometimes|boolean',
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        $category = Category::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Category created successfully!',
            'category' => $category,
        ], 201);
    }

    // Update category
    public function update(Request $request, Category $category)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('categories', 'name')->ignore($category->id),
            ],
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'is_active' => 'sometimes|boolean',
        ]);

        if (array_key_exists('name', $validated)) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $category->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Category updated successfully!',
            'category' => $category->fresh()->loadCount('questions'),
        ]);
    }

    // Delete category
    public function destroy(Request $request, Category $category)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Category deleted successfully! Its questions are preserved as uncategorized.',
        ]);
    }
}
