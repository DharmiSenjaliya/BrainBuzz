<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class KnowledgeCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Science', 'slug' => 'science', 'description' => 'Discover the natural world and scientific ideas.', 'icon' => '🔬'],
            ['name' => 'Technology', 'slug' => 'technology', 'description' => 'Explore inventions, computing, and modern technology.', 'icon' => '💻'],
            ['name' => 'History', 'slug' => 'history', 'description' => 'Test your knowledge of people and events from the past.', 'icon' => '🏛️'],
            ['name' => 'Geography', 'slug' => 'geography', 'description' => 'Explore places, countries, and the world around us.', 'icon' => '🌍'],
            ['name' => 'Sports', 'slug' => 'sports', 'description' => 'Questions about sports, athletes, and competitions.', 'icon' => '🏅'],
            ['name' => 'General Knowledge', 'slug' => 'general-knowledge', 'description' => 'A mix of interesting facts from many subjects.', 'icon' => '💡'],
        ];

        foreach ($categories as $attributes) {
            $existingCategory = Category::query()
                ->where('slug', $attributes['slug'])
                ->orWhere('name', $attributes['name'])
                ->first();

            if (!$existingCategory) {
                Category::create($attributes + ['is_active' => true]);
            }
        }
    }
}
