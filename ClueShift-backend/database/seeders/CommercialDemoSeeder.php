<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Category;
use App\Models\Question;
use App\Models\GameResult;
use Illuminate\Support\Facades\Hash;

class CommercialDemoSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ensure Super Admin Exists
        User::firstOrCreate(
            ['email' => 'admin@clueshift.game'],
            [
                'name' => 'ClueShift Admin',
                'password' => Hash::make('admin123456'),
                'is_admin' => true,
                'is_active' => true,
            ]
        );

        // 2. Demo Players for Leaderboard
        $demoPlayers = [
            ['name' => 'Alex Rivera', 'email' => 'alex@example.com', 'score' => 1420],
            ['name' => 'Priya Patel', 'email' => 'priya@example.com', 'score' => 1280],
            ['name' => 'Kenji Sato', 'email' => 'kenji@example.com', 'score' => 960],
            ['name' => 'Elena Rostova', 'email' => 'elena@example.com', 'score' => 840],
            ['name' => 'Marcus Vance', 'email' => 'marcus@example.com', 'score' => 720],
        ];

        foreach ($demoPlayers as $playerData) {
            $user = User::firstOrCreate(
                ['email' => $playerData['email']],
                [
                    'name' => $playerData['name'],
                    'password' => Hash::make('password123'),
                    'is_admin' => false,
                    'is_active' => true,
                ]
            );

            // Add demo game results so analytics charts look rich
            if (GameResult::where('user_id', $user->id)->count() === 0) {
                GameResult::create([
                    'user_id' => $user->id,
                    'level' => rand(1, 5),
                    'score' => $playerData['score'],
                    'correct_answers' => rand(3, 5),
                    'wrong_answers' => rand(0, 2),
                    'total_questions' => 5,
                    'passed' => true,
                    'created_at' => now()->subDays(rand(0, 5)),
                ]);
            }
        }

        // 3. Rich Categories
        $categories = [
            ['name' => 'Science & Cosmos', 'icon' => '🚀', 'description' => 'Physics, astronomy, biology and the mysteries of the universe.'],
            ['name' => 'Technology & Code', 'icon' => '💻', 'description' => 'Hardware, AI, internet culture and software revolutions.'],
            ['name' => 'World History', 'icon' => '🏛️', 'description' => 'Ancient empires, historic revolutions, and world leaders.'],
            ['name' => 'Geography & Nature', 'icon' => '🌍', 'description' => 'Continents, capitals, rivers, peaks and wildlife.'],
            ['name' => 'Cinema & Pop Culture', 'icon' => '🎬', 'description' => 'Blockbuster movies, music legends and iconic media.'],
            ['name' => 'Sports & Champions', 'icon' => '🏆', 'description' => 'Olympics, football, cricket, tennis and legendary athletes.'],
            ['name' => 'General Logic', 'icon' => '🧠', 'description' => 'Brain teasers, wordplay, and smart deductions.'],
        ];

        $categoryModels = [];
        foreach ($categories as $cat) {
            $slug = \Illuminate\Support\Str::slug($cat['name']);
            $categoryModels[$cat['name']] = Category::firstOrCreate(
                ['name' => $cat['name']],
                [
                    'slug' => $slug,
                    'icon' => $cat['icon'],
                    'description' => $cat['description'],
                    'is_active' => true,
                ]
            );
        }

        // 4. Curated Questions across multiple levels
        $questions = [
            // Level 1
            [
                'cat' => 'Science & Cosmos',
                'title' => 'The Red Wanderer',
                'clues' => ['Fourth planet from Sun', 'Red surface due to iron oxide', 'Has two small moons', 'Explored by Curiosity and Perseverance', 'Named after Roman God of War'],
                'answer' => 'Mars',
                'hint' => 'Often called the Red Planet',
                'level' => 1,
                'points' => 10,
            ],
            [
                'cat' => 'Technology & Code',
                'title' => 'Search Giant',
                'clues' => ['Founded by Page & Brin in 1998', 'Android mobile OS developer', 'Mountain View California HQ', 'Chrome browser creator', 'Popularized search verb'],
                'answer' => 'Google',
                'hint' => 'Starts with the letter G',
                'level' => 1,
                'points' => 10,
            ],
            [
                'cat' => 'Geography & Nature',
                'title' => 'Land of Pharaohs',
                'clues' => ['North African nation', 'Nile river flows through it', 'Home of Great Pyramids', 'Sphinx guardian monument', 'Capital is Cairo'],
                'answer' => 'Egypt',
                'hint' => 'Pyramids of Giza location',
                'level' => 1,
                'points' => 10,
            ],
            [
                'cat' => 'General Logic',
                'title' => 'Sweet Summer Delight',
                'clues' => ['King of fruits', 'National fruit of India', 'Tropical stone fruit', 'Yellow juicy pulp', 'Alphonso and Kesar varieties'],
                'answer' => 'Mango',
                'hint' => 'Juicy sweet yellow fruit',
                'level' => 1,
                'points' => 10,
            ],
            [
                'cat' => 'Cinema & Pop Culture',
                'title' => 'Armored Avenger',
                'clues' => ['Billionaire genius inventor', 'Arc reactor heart', 'Tony Stark alter-ego', 'Red and gold powered suit', 'Played by Robert Downey Jr.'],
                'answer' => 'Iron Man',
                'hint' => 'Marvel superhero in suit of armor',
                'level' => 1,
                'points' => 10,
            ],

            // Level 2
            [
                'cat' => 'Science & Cosmos',
                'title' => 'Ringed Giant',
                'clues' => ['Sixth planet from the Sun', 'Spectacular icy ring system', 'Gas giant with Titan moon', 'Named after Saturnus', 'Lower density than water'],
                'answer' => 'Saturn',
                'hint' => 'Known for prominent rings',
                'level' => 2,
                'points' => 15,
            ],
            [
                'cat' => 'World History',
                'title' => 'Infinite Monument',
                'clues' => ['Constructed across centuries', 'Over 21,000 km in length', 'Guarded northern Chinese borders', 'Ming dynasty stone towers', 'Visible from satellite imagery'],
                'answer' => 'Great Wall of China',
                'hint' => 'Famous ancient wall in Asia',
                'level' => 2,
                'points' => 15,
            ],
            [
                'cat' => 'Technology & Code',
                'title' => 'Bitten Fruit Pioneer',
                'clues' => ['Founded in garage by Jobs & Wozniak', 'Cupertino spaceship headquarters', 'Macintosh and iPhone maker', 'Valued in trillions of dollars', 'Logo with a single bite taken'],
                'answer' => 'Apple',
                'hint' => 'Fruit named technology giant',
                'level' => 2,
                'points' => 15,
            ],
            [
                'cat' => 'Sports & Champions',
                'title' => 'Master Blaster',
                'clues' => ['Indian cricket deity', '100 international centuries', 'Played 200 Test matches', 'Wore jersey number 10', 'Bharat Ratna recipient'],
                'answer' => 'Sachin Tendulkar',
                'hint' => 'Little Master of Indian Cricket',
                'level' => 2,
                'points' => 15,
            ],
            [
                'cat' => 'Geography & Nature',
                'title' => 'The Pearl of France',
                'clues' => ['City of Lights and romance', 'Eiffel Tower landmark', 'River Seine flows across', 'Louvre art museum home', 'Hosted 2024 Olympic Games'],
                'answer' => 'Paris',
                'hint' => 'Capital city of France',
                'level' => 2,
                'points' => 15,
            ],

            // Level 3
            [
                'cat' => 'Technology & Code',
                'title' => 'The Open Source Whale',
                'clues' => ['Containerization technology', 'Blue whale logo carrying boxes', 'Lightweight virtual environments', 'Dockerfile definitions', 'Runs isolated software microservices'],
                'answer' => 'Docker',
                'hint' => 'Container software starting with D',
                'level' => 3,
                'points' => 20,
            ],
            [
                'cat' => 'Science & Cosmos',
                'title' => 'Subatomic Messenger',
                'clues' => ['Elementary particle of light', 'Zero rest mass', 'Travels at 299,792 km/s', 'Quantum of electromagnetic field', 'Photoelectric effect particle'],
                'answer' => 'Photon',
                'hint' => 'Light quantum starting with Ph',
                'level' => 3,
                'points' => 20,
            ],
            [
                'cat' => 'World History',
                'title' => 'The Colosseum Arena',
                'clues' => ['Gladiatorial combat arena', 'Ancient Roman engineering', 'Flavian amphitheater', 'Vespasian commissioned it', 'Standing in heart of Rome'],
                'answer' => 'Colosseum',
                'hint' => 'Famous elliptical amphitheatre in Rome',
                'level' => 3,
                'points' => 20,
            ],
            [
                'cat' => 'Cinema & Pop Culture',
                'title' => 'The Dark Knight',
                'clues' => ['Billionaire orphan Bruce Wayne', 'Batcave beneath mansion', 'Batmobile crime vehicle', 'Protector of Gotham City', 'Fights Joker and Bane'],
                'answer' => 'Batman',
                'hint' => 'DC superhero known as Caped Crusader',
                'level' => 3,
                'points' => 20,
            ],
            [
                'cat' => 'Sports & Champions',
                'title' => 'The Beautiful Game',
                'clues' => ['11 players per team on pitch', 'FIFA World Cup tournament', 'Lionel Messi and Ronaldo legends', 'Goalposts with net', 'Ball kicked with feet only'],
                'answer' => 'Football',
                'hint' => 'Also called soccer in America',
                'level' => 3,
                'points' => 20,
            ],
        ];

        foreach ($questions as $q) {
            $catId = $categoryModels[$q['cat']]->id ?? null;
            Question::firstOrCreate(
                ['title' => $q['title']],
                [
                    'category_id' => $catId,
                    'clues' => $q['clues'],
                    'answer' => $q['answer'],
                    'hint' => $q['hint'],
                    'level' => $q['level'],
                    'points' => $q['points'],
                    'is_active' => true,
                ]
            );
        }
    }
}
