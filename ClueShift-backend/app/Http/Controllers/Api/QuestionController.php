<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Question;
use App\Models\Category;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    // Check admin access
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

    // Generate balanced 50:50 choices (Answer + Distractor, shuffled)
    private function generateFiftyFiftyPair($question)
    {
        $answer = trim($question->answer ?? '');
        if (empty($answer)) {
            return ['Option A', 'Option B'];
        }

        $knownPairs = [
            'hexagon' => 'Octagon',
            'octagon' => 'Heptagon',
            'pentagon' => 'Hexagon',
            'triangle' => 'Square',
            'square' => 'Rectangle',
            'circle' => 'Oval',
            'polygon' => 'Polyhedron',
            'neil armstrong' => 'Buzz Aldrin',
            'buzz aldrin' => 'Neil Armstrong',
            'saturn' => 'Jupiter',
            'jupiter' => 'Saturn',
            'mars' => 'Venus',
            'sun' => 'Moon',
            'moon' => 'Sun',
            'venus' => 'Mars',
            'earth' => 'Mars',
            'apple' => 'Microsoft',
            'google' => 'Yahoo',
            'cpu' => 'RAM',
            'internet' => 'Intranet',
            'github' => 'GitLab',
            'firewall' => 'Antivirus',
            'phishing' => 'Malware',
            'vpn' => 'Proxy',
            'encryption' => 'Hashing',
            'gold' => 'Silver',
            'water' => 'Hydrogen',
            'clock' => 'Hourglass',
            'football' => 'Rugby',
            'cricket' => 'Baseball',
            'mount everest' => 'K2',
            'amazon river' => 'Nile River',
            'paris' => 'Rome',
            'colosseum' => 'Parthenon',
            'great wall' => 'Forbidden City',
            'egypt' => 'Mesopotamia',
            'leonardo da vinci' => 'Michelangelo',
            'tiger' => 'Leopard',
            'whale' => 'Shark',
            'panda' => 'Koala',
        ];

        $lowerAns = strtolower($answer);
        $distractor = $knownPairs[$lowerAns] ?? null;

        if (!$distractor && !empty($question->category_id)) {
            $distractor = Question::where('id', '!=', $question->id)
                ->where('category_id', $question->category_id)
                ->where('is_active', true)
                ->inRandomOrder()
                ->value('answer');
        }

        if (!$distractor) {
            $distractor = Question::where('id', '!=', $question->id)
                ->where('is_active', true)
                ->inRandomOrder()
                ->value('answer');
        }

        if (!$distractor || strtolower(trim($distractor)) === $lowerAns) {
            $distractor = strlen($answer) > 4 ? substr($answer, 0, 3) . '...' : $answer . ' Plus';
        }

        $pair = [$answer, trim($distractor)];
        shuffle($pair);
        return $pair;
    }

    // Get 5 random active questions for selected level and category
    public function index(Request $request)
    {
        $validated = $request->validate([
            'level' => 'required|integer|min:1',
            'category_id' => 'nullable|integer|exists:categories,id',
        ]);

        $query = Question::where('level', $validated['level'])
            ->where('is_active', true)
            ->where(function ($categoryQuery) {
                $categoryQuery->whereNull('category_id')
                    ->orWhereHas('category', function ($activeCategory) {
                        $activeCategory->where('is_active', true);
                    });
            });

        if (!empty($validated['category_id'])) {
            $query->where('category_id', $validated['category_id']);
        }

        $rawQuestions = $query
            ->inRandomOrder()
            ->limit(5)
            ->get([
                'id',
                'category_id',
                'title',
                'clues',
                'hint',
                'level',
                'points',
                'answer',
            ]);

        $questions = $rawQuestions->map(function ($q) {
            $choices = $this->generateFiftyFiftyPair($q);
            return [
                'id' => $q->id,
                'category_id' => $q->category_id,
                'title' => $q->title,
                'clues' => is_array($q->clues) ? $q->clues : json_decode($q->clues, true) ?? [],
                'hint' => $q->hint,
                'level' => $q->level,
                'points' => $q->points,
                'fifty_fifty_choices' => $choices,
            ];
        });

        return response()->json([
            'questions' => $questions,
        ]);
    }

    // Dedicated 50:50 Lifeline Endpoint
    public function fiftyFiftyLifeline(Request $request)
    {
        $validated = $request->validate([
            'question_id' => 'required|integer|exists:questions,id',
        ]);

        $question = Question::find($validated['question_id']);
        if (!$question || !$question->is_active) {
            return response()->json(['success' => false, 'message' => 'Question not found'], 404);
        }

        $choices = $this->generateFiftyFiftyPair($question);

        return response()->json([
            'success' => true,
            'choices' => $choices,
        ]);
    }

    // Check player's answer
    public function checkAnswer(Request $request)
    {
        $validated = $request->validate([
            'question_id' => 'required|integer|exists:questions,id',
            'answer' => 'required|string|max:255',
            'category_id' => 'nullable|integer|exists:categories,id',
        ]);

        $question = Question::where('id', $validated['question_id'])
            ->where('is_active', true)
            ->where(function ($categoryQuery) {
                $categoryQuery->whereNull('category_id')
                    ->orWhereHas('category', function ($activeCategory) {
                        $activeCategory->where('is_active', true);
                    });
            })
            ->when(
                !empty($validated['category_id']),
                function ($query) use ($validated) {
                    $query->where('category_id', $validated['category_id']);
                }
            )
            ->first();

        if (!$question) {
            return response()->json([
                'correct' => false,
                'points' => 0,
                'message' => 'Question is not available.',
            ], 404);
        }

        $playerAnswer = mb_strtolower(trim($validated['answer']));
        $correctAnswer = mb_strtolower(trim($question->answer));

        if ($playerAnswer === $correctAnswer) {
            return response()->json([
                'correct' => true,
                'points' => (int) $question->points,
                'message' => 'Correct answer!',
            ]);
        }

        return response()->json([
            'correct' => false,
            'points' => 0,
            'message' => 'Wrong answer! Try again.',
        ]);
    }

    // Add new question
    public function store(Request $request)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        $validated = $request->validate([
            'category_id' => 'nullable|integer|exists:categories,id',
            'title' => 'required|string|max:255',
            'clues' => 'required|array|min:1|max:5',
            'clues.*' => 'required|string',
            'answer' => 'required|string|max:255',
            'hint' => 'nullable|string',
            'level' => 'required|integer|min:1',
            'points' => 'nullable|integer|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        if (!empty($validated['category_id'])) {
            $category = Category::find($validated['category_id']);

            if (!$category || !$category->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Selected category is inactive or unavailable.',
                ], 422);
            }
        }

        $question = Question::create($validated);

        return response()->json([
            'message' => 'Question created successfully!',
            'question' => $question->load('category'),
        ], 201);
    }

    // Get all questions for admin
    public function adminIndex(Request $request)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        return response()->json([
            'questions' => Question::with('category')
                ->orderBy('level')
                ->orderBy('id')
                ->get(),
        ]);
    }

    // Update question
    public function update(Request $request, Question $question)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        $validated = $request->validate([
            'category_id' => 'sometimes|nullable|integer|exists:categories,id',
            'title' => 'sometimes|required|string|max:255',
            'clues' => 'sometimes|required|array|min:1|max:5',
            'clues.*' => 'required|string',
            'answer' => 'sometimes|required|string|max:255',
            'hint' => 'nullable|string',
            'level' => 'sometimes|required|integer|min:1',
            'points' => 'sometimes|integer|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        if (!empty($validated['category_id'])) {
            $category = Category::find($validated['category_id']);

            if (!$category || !$category->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Selected category is inactive or unavailable.',
                ], 422);
            }
        }

        $question->update($validated);

        return response()->json([
            'message' => 'Question updated successfully!',
            'question' => $question->fresh()->load('category'),
        ]);
    }

    // Delete question
    public function destroy(Request $request, Question $question)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        $question->delete();

        return response()->json([
            'message' => 'Question deleted successfully!',
        ]);
    }

    // Bulk Import Questions from CSV (File or Raw Text)
    public function importCsv(Request $request)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        $csvContent = '';

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $csvContent = file_get_contents($file->getRealPath());
        } elseif ($request->filled('csv_text')) {
            $csvContent = $request->input('csv_text');
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Please upload a CSV file or provide CSV text content.',
            ], 422);
        }

        $lines = preg_split('/\r\n|\r|\n/', trim($csvContent));
        if (count($lines) < 2) {
            return response()->json([
                'success' => false,
                'message' => 'CSV file is empty or does not contain data rows.',
            ], 422);
        }

        $header = str_getcsv(array_shift($lines));
        $header = array_map(fn($col) => strtolower(trim($col)), $header);

        $imported = 0;
        $errors = [];

        foreach ($lines as $index => $line) {
            if (!trim($line)) continue;

            $row = str_getcsv($line);
            if (count($row) < 4) {
                $errors[] = "Row " . ($index + 2) . ": insufficient columns.";
                continue;
            }

            $data = [];
            foreach ($header as $colIndex => $colName) {
                $data[$colName] = $row[$colIndex] ?? null;
            }

            // Extract Title, Answer, Level, Points
            $title = trim($data['title'] ?? $row[1] ?? 'Trivia Question');
            $answer = trim($data['answer'] ?? $row[7] ?? '');
            $hint = trim($data['hint'] ?? $row[8] ?? '');
            $level = max(1, (int) ($data['level'] ?? $row[9] ?? 1));
            $points = max(5, (int) ($data['points'] ?? $row[10] ?? 10));

            // Extract Clues (clue1 to clue5 or comma-separated)
            $clues = [];
            for ($i = 1; $i <= 5; $i++) {
                $clueKey = "clue{$i}";
                if (!empty($data[$clueKey])) {
                    $clues[] = trim($data[$clueKey]);
                }
            }

            // Fallback to row index if named headers weren't used
            if (empty($clues)) {
                for ($i = 2; $i <= 6; $i++) {
                    if (!empty($row[$i])) {
                        $clues[] = trim($row[$i]);
                    }
                }
            }

            if (empty($clues)) {
                $clues = ['Clue 1', 'Clue 2', 'Clue 3'];
            }

            if (!$answer) {
                $errors[] = "Row " . ($index + 2) . ": missing answer.";
                continue;
            }

            // Match or create category
            $categoryName = trim($data['category'] ?? $data['category_name'] ?? $row[0] ?? '');
            $categoryId = null;
            if ($categoryName) {
                $cat = Category::firstOrCreate(
                    ['name' => $categoryName],
                    ['description' => "Category for {$categoryName}", 'is_active' => true]
                );
                $categoryId = $cat->id;
            }

            Question::create([
                'category_id' => $categoryId,
                'title' => $title,
                'clues' => $clues,
                'answer' => $answer,
                'hint' => $hint ?: null,
                'level' => $level,
                'points' => $points,
                'is_active' => true,
            ]);

            $imported++;
        }

        return response()->json([
            'success' => true,
            'imported_count' => $imported,
            'message' => "Successfully imported {$imported} questions!",
            'errors' => $errors,
        ]);
    }

    // Export Questions to CSV
    public function exportCsv(Request $request)
    {
        $user = $request->user();
        if (!$user && $request->filled('token')) {
            $tokenModel = \Laravel\Sanctum\PersonalAccessToken::findToken($request->query('token'));
            if ($tokenModel) {
                $user = $tokenModel->tokenable;
            }
        }

        if (!$user || !$user->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access required.',
            ], 403);
        }

        $questions = Question::with('category')->orderBy('level')->orderBy('id')->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="clueshift-questions.csv"',
        ];

        $callback = function () use ($questions) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['category', 'title', 'clue1', 'clue2', 'clue3', 'clue4', 'clue5', 'answer', 'hint', 'level', 'points']);

            foreach ($questions as $q) {
                $clues = is_array($q->clues) ? $q->clues : json_decode($q->clues, true) ?? [];
                fputcsv($file, [
                    $q->category?->name ?? 'General',
                    $q->title,
                    $clues[0] ?? '',
                    $clues[1] ?? '',
                    $clues[2] ?? '',
                    $clues[3] ?? '',
                    $clues[4] ?? '',
                    $q->answer,
                    $q->hint ?? '',
                    $q->level,
                    $q->points,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    // Download Sample CSV Template
    public function sampleCsv(Request $request)
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="clueshift-sample-template.csv"',
        ];

        $callback = function () {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['category', 'title', 'clue1', 'clue2', 'clue3', 'clue4', 'clue5', 'answer', 'hint', 'level', 'points']);

            $samples = [
                ['Science', 'Celestial Giant', 'Red Planet', 'Fourth from Sun', 'Has Rover', 'Named after War God', 'Phobos and Deimos', 'Mars', 'Often visited by NASA rovers', 1, 10],
                ['Technology', 'Tech Titan', 'Search Engine', 'Android OS', 'Founded by Larry & Sergey', 'Mountain View HQ', 'YouTube Owner', 'Google', 'Starts with G', 1, 10],
                ['Geography', 'Ancient Wonder', 'River Nile', 'Cairo capital', 'Pyramids of Giza', 'Pharaohs', 'Sphinx guardian', 'Egypt', 'North African historic nation', 2, 15],
                ['General Knowledge', 'King of Fruits', 'Tropical delight', 'Yellow pulp', 'National fruit of India', 'Alphonsus variety', 'Summer seasonal', 'Mango', 'Sweet summer fruit', 1, 10],
                ['History', 'Great Wall', 'Beijing capital', 'Silk Road', 'Forbidden City', 'Dynasties', 'Terracotta Army', 'China', 'Asian ancient empire', 2, 15],
            ];

            foreach ($samples as $sample) {
                fputcsv($file, $sample);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    // AI Question Generator for Admin Panel
    public function generateWithAi(Request $request)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        $validated = $request->validate([
            'topic' => 'required|string|max:100',
            'level' => 'nullable|integer|min:1|max:50',
            'category_id' => 'nullable|integer|exists:categories,id',
            'category_ids' => 'nullable|array|max:20',
            'category_ids.*' => 'nullable|integer|exists:categories,id',
            'count' => 'nullable|integer|min:1|max:10',
        ]);

        $topic = trim($validated['topic']);
        $level = $validated['level'] ?? 1;
        $count = $validated['count'] ?? 3;

        // Support multiple selected categories mapped per question
        $categoryIds = [];
        if (!empty($validated['category_ids']) && is_array($validated['category_ids'])) {
            $categoryIds = array_values(array_filter($validated['category_ids']));
        } elseif (!empty($validated['category_id'])) {
            $categoryIds = [$validated['category_id']];
        }

        // Rich procedural AI knowledge generator for instant high quality questions
        $aiTemplates = [
            'cyber_security' => [
                ['title' => 'Network Shield', 'clues' => ['Monitors incoming and outgoing traffic', 'Blocks unauthorized port access', 'Can be hardware or software based', 'Packet inspection mechanism', 'Primary barrier between trusted and untrusted networks'], 'answer' => 'Firewall', 'hint' => 'Network security barrier'],
                ['title' => 'Deceptive Bait', 'clues' => ['Fraudulent email or message scam', 'Impersonates banks or reputable brands', 'Lures victims to fake login pages', 'Primary vector for credential harvesting', 'Common form of social engineering'], 'answer' => 'Phishing', 'hint' => 'Email scam technique'],
                ['title' => 'Encrypted Tunnel', 'clues' => ['Stands for Virtual Private Network', 'Masks user original IP address', 'Encrypts data across public Wi-Fi', 'Enables secure remote access', 'Establishes encrypted point-to-point tunnel'], 'answer' => 'VPN', 'hint' => 'Three-letter privacy tool'],
                ['title' => 'Cryptographic Lock', 'clues' => ['Converts readable plaintext into ciphertext', 'Requires private or public mathematical keys', 'AES and RSA are industry standards', 'Protects data in transit and at rest', 'Foundation of HTTPS and SSL protocols'], 'answer' => 'Encryption', 'hint' => 'Data scrambling technique'],
                ['title' => 'Hostile Payload', 'clues' => ['Collective term for malicious software', 'Includes viruses trojans and worms', 'Infects systems through rogue downloads', 'Detected and quarantined by antivirus', 'Can steal files or spy on activity'], 'answer' => 'Malware', 'hint' => 'Generic term for malicious code'],
                ['title' => 'Dual Verification', 'clues' => ['Extra login security beyond passwords', 'Combines something you know and have', 'Sends one-time OTP code or prompt', 'Drastically reduces account takeover risk', 'Commonly abbreviated as 2FA'], 'answer' => 'Two-Factor Authentication', 'hint' => 'Abbreviated as 2FA'],
                ['title' => 'Digital Extortion', 'clues' => ['Malicious code that encrypts personal files', 'Demands cryptocurrency to restore access', 'WannaCry and NotPetya are famous cases', 'Cripples hospitals and corporations', 'Regular offline backups mitigate damage'], 'answer' => 'Ransomware', 'hint' => 'Hostage taking malware'],
                ['title' => 'White Hat Guardian', 'clues' => ['Authorized penetration testing expert', 'Discovers zero-day vulnerabilities legally', 'Helps organizations patch security holes', 'Participates in bug bounty programs', 'Opposite of malicious black hat attacker'], 'answer' => 'Ethical Hacker', 'hint' => 'Also called white hat hacker'],
                ['title' => 'Unpatched Threat', 'clues' => ['Security flaw unknown to software vendor', 'Zero days exist between discovery and patch', 'Highly prized on dark web markets', 'Can bypass standard defensive signatures', 'Requires urgent emergency security patches'], 'answer' => 'Zero-Day Exploit', 'hint' => 'Newly exposed unpatched flaw'],
                ['title' => 'Botnet Deluge', 'clues' => ['Distributed denial of service assault', 'Floods target servers with junk traffic', 'Harnesses compromised zombie computers', 'Causes catastrophic website downtime', 'Mitigated by traffic scrubbers and CDN'], 'answer' => 'DDoS Attack', 'hint' => 'Server flooding attack'],
                ['title' => 'Credential Vault', 'clues' => ['Secure application storing user logins', 'Generates high entropy complex passwords', 'Protected by single strong master passphrase', 'Autofills credentials securely', 'Prevents vulnerable password reuse'], 'answer' => 'Password Manager', 'hint' => 'Tool to store and autofill passwords'],
                ['title' => 'Biological Key', 'clues' => ['Authentication using biological traits', 'Fingerprint scanners and facial recognition', 'Retina or iris verification in high security', 'Impossible to easily guess or forget', 'Standard on modern smartphones'], 'answer' => 'Biometrics', 'hint' => 'Body trait verification'],
            ],
            'technology' => [
                ['title' => 'Digital Brain', 'clues' => ['Central processing unit', 'Silicon chip', 'Intel or AMD', 'Clock speed in GHz', 'Heart of motherboard'], 'answer' => 'CPU', 'hint' => 'Computer brain acronym'],
                ['title' => 'Global Net', 'clues' => ['World Wide Web', 'TCP/IP protocol', 'Hyperlinks', 'Browsers navigate it', 'Fiber optic cables'], 'answer' => 'Internet', 'hint' => 'Global connected network'],
                ['title' => 'Apple Pioneer', 'clues' => ['Macintosh creator', 'iPhone launcher', 'Cupertino giant', 'Steve Jobs co-founder', 'App Store ecosystem'], 'answer' => 'Apple', 'hint' => 'Fruit named tech company'],
                ['title' => 'Search Engine Titan', 'clues' => ['Founded by Page & Brin', 'Android mobile OS', 'Mountain View California', 'Chrome browser', 'YouTube parent company'], 'answer' => 'Google', 'hint' => 'Famous search engine'],
                ['title' => 'Coding Repository', 'clues' => ['Octocat mascot', 'Version control platform', 'Git commits and pull requests', 'Open source collaboration', 'Acquired by Microsoft'], 'answer' => 'GitHub', 'hint' => 'Code hosting platform'],
                ['title' => 'Machine Cognition', 'clues' => ['Artificial intelligence models', 'Deep neural networks', 'Natural language processing', 'Powers ChatGPT and Gemini', 'Self-learning algorithms'], 'answer' => 'Artificial Intelligence', 'hint' => 'Abbreviated as AI'],
                ['title' => 'On-Demand Cloud', 'clues' => ['Virtual servers and remote storage', 'AWS Azure and Google Cloud', 'Replaces physical on-premise racks', 'Auto-scaling infrastructure', 'Pay-as-you-go computing'], 'answer' => 'Cloud Computing', 'hint' => 'Elastic remote computing service'],
                ['title' => 'Decentralized Chain', 'clues' => ['Cryptographic distributed ledger', 'Immutable blocks linked by hashes', 'Underpins Bitcoin and Ethereum', 'Proof of Work and Proof of Stake', 'No central authority required'], 'answer' => 'Blockchain', 'hint' => 'Crypto ledger technology'],
                ['title' => 'Penguin Kernel', 'clues' => ['Open source Unix-like kernel', 'Created by Linus Torvalds', 'Tux the penguin mascot', 'Powers most internet servers', 'Distributions like Ubuntu and Debian'], 'answer' => 'Linux', 'hint' => 'Free open source operating system'],
                ['title' => 'Relational Vault', 'clues' => ['Structured data storage system', 'Queried via SQL language', 'Tables with rows and columns', 'ACID transactions guarantee', 'MySQL and PostgreSQL examples'], 'answer' => 'Database', 'hint' => 'Structured data management system'],
                ['title' => 'Quantum Leap', 'clues' => ['Processes data using quantum qubits', 'Exploits superposition and entanglement', 'Solves complex problems exponentially faster', 'Requires cryogenic ultra-cold cooling', 'Frontier of modern computing'], 'answer' => 'Quantum Computer', 'hint' => 'Qubit computing system'],
                ['title' => 'Silicon Heart', 'clues' => ['Integrated circuit on a silicon die', 'Billions of microscopic transistors', 'Executes machine instructions', 'Invented by Intel in 1971', 'Powers laptops smartphones and cars'], 'answer' => 'Microprocessor', 'hint' => 'Miniature chip processor'],
            ],
            'space' => [
                ['title' => 'Starry Orbit', 'clues' => ['Ringed world', 'Sixth planet', 'Gas giant', 'Cassini explored it', 'Titan is largest moon'], 'answer' => 'Saturn', 'hint' => 'Famous for its rings'],
                ['title' => 'Cosmic Core', 'clues' => ['Center of solar system', 'Nuclear fusion', 'Yellow dwarf star', 'Solar flares', 'Sunlight takes 8 mins to Earth'], 'answer' => 'Sun', 'hint' => 'Our nearest star'],
                ['title' => 'Night Orb', 'clues' => ['Earth satellite', 'Apollo 11 landed here', 'Tidal gravity', 'Cratered surface', 'Neil Armstrong walked on it'], 'answer' => 'Moon', 'hint' => 'Visible in night sky'],
                ['title' => 'Red Wanderer', 'clues' => ['Fourth from Sun', 'Olympus Mons peak', 'Phobos & Deimos moons', 'Rust iron dust', 'NASA Perseverance rover'], 'answer' => 'Mars', 'hint' => 'The Red Planet'],
                ['title' => 'King of Planets', 'clues' => ['Largest planet in system', 'Great Red Spot storm', 'Over 90 moons', 'Europa ocean moon', 'Massive gas giant'], 'answer' => 'Jupiter', 'hint' => 'Fifth planet from Sun'],
                ['title' => 'Cosmic Abyss', 'clues' => ['Infinitely dense singularity', 'Gravitational pull traps light', 'Surrounded by event horizon', 'Supermassive monster at galaxy center', 'Predicted by Einstein general relativity'], 'answer' => 'Black Hole', 'hint' => 'Space gravity sinkhole'],
                ['title' => 'Deep Space Eye', 'clues' => ['Space telescope launched in 1990', 'Orbits outside Earth atmosphere blur', 'Captured the famous Pillars of Creation', 'Named after astronomer Edwin', 'Provided ultra-deep cosmic field images'], 'answer' => 'Hubble Space Telescope', 'hint' => 'Famous orbital telescope'],
                ['title' => 'Stellar Cataclysm', 'clues' => ['Violent explosion of a dying giant star', 'Shines brighter than an entire galaxy', 'Produces heavy elements like gold', 'Leaves behind a pulsar or black hole', 'Creates colorful expanding nebulae'], 'answer' => 'Supernova', 'hint' => 'Exploding dying star'],
                ['title' => 'Galactic Spiral', 'clues' => ['Barred spiral galaxy holding our Sun', 'Contains over 100 billion stars', 'Sagittarius A* black hole at core', 'Visible across clear dark skies as milky band', 'Part of the Local Group'], 'answer' => 'Milky Way', 'hint' => 'Our home galaxy'],
                ['title' => 'Dirty Snowball', 'clues' => ['Small icy celestial body', 'Develops glowing coma and long tail', 'Tail always points away from the Sun', 'Halley visits every 75-76 years', 'Originates in Kuiper Belt or Oort Cloud'], 'answer' => 'Comet', 'hint' => 'Icy cosmic wanderer with tail'],
                ['title' => 'Inferno Sister', 'clues' => ['Second planet from the Sun', 'Runaway greenhouse effect', 'Hottest planetary surface over 460C', 'Sulfuric acid rain and crushing pressure', 'Often called Earth twin sister'], 'answer' => 'Venus', 'hint' => 'Hottest second planet'],
                ['title' => 'Alien World', 'clues' => ['Planet orbiting a star beyond our solar system', 'Discovered by Kepler and James Webb', 'Thousands confirmed to date', 'Some orbit inside habitable Goldilocks zones', 'Could potentially harbor extraterrestrial life'], 'answer' => 'Exoplanet', 'hint' => 'Planet outside solar system'],
            ],
            'science' => [
                ['title' => 'Genetic Spiral', 'clues' => ['Double helix molecular structure', 'Discovered by Watson Crick and Franklin', 'Carries hereditary genetic instructions', 'Made of adenine thymine cytosine guanine', 'Located inside cell nucleus'], 'answer' => 'DNA', 'hint' => 'Blueprint of biological life'],
                ['title' => 'Solar Harvest', 'clues' => ['Biological process converting sunlight to energy', 'Absorbs carbon dioxide and water', 'Produces glucose and releases oxygen', 'Uses chlorophyll pigment in plant chloroplasts', 'Primary fuel generator for Earth biosphere'], 'answer' => 'Photosynthesis', 'hint' => 'Plant light-to-energy process'],
                ['title' => 'Universal Pull', 'clues' => ['Fundamental force of attraction between masses', 'Legendary apple falling on Isaac Newton', 'Described as spacetime curvature by Einstein', 'Causes oceanic tides alongside Moon', 'Accelerates falling objects at 9.8 m/s2 on Earth'], 'answer' => 'Gravity', 'hint' => 'Universal downward attraction force'],
                ['title' => 'Building Block', 'clues' => ['Basic constituent of chemical matter', 'Protons and neutrons inside nucleus', 'Surrounded by electron cloud probability', 'Subatomic fission releases tremendous energy', 'Named from Greek word for indivisible'], 'answer' => 'Atom', 'hint' => 'Fundamental element unit'],
                ['title' => 'Element Matrix', 'clues' => ['Tabular arrangement of 118 chemical elements', 'Organized by atomic number and electron shells', 'First arranged by Dmitri Mendeleev', 'Periods rows and groups columns', 'Metals nonmetals and inert noble gases'], 'answer' => 'Periodic Table', 'hint' => 'Table of chemical elements'],
                ['title' => 'Electric Charge', 'clues' => ['Movement of electrical charge through conductors', 'Alternating and direct current formats', 'Tesla and Edison historical rivalry', 'Measured in volts amperes and watts', 'Powers modern global civilization'], 'answer' => 'Electricity', 'hint' => 'Flow of electrons'],
                ['title' => 'Respiration Element', 'clues' => ['Chemical element with atomic number 8', 'Symbol O on the periodic table', 'Makes up about 21 percent of atmospheric air', 'Essential for aerobic respiration', 'Supports active fire combustion'], 'answer' => 'Oxygen', 'hint' => 'Breathable atmospheric gas'],
                ['title' => 'Coherent Beam', 'clues' => ['Light amplification by stimulated emission', 'Monochromatic single wavelength beam', 'Used in optical fiber barcodes and laser surgery', 'Highly collimated light travels long distances', 'Invented in the mid-20th century'], 'answer' => 'Laser', 'hint' => 'Concentrated light ray beam'],
                ['title' => 'Microscopic Viewer', 'clues' => ['Optical or electron magnification device', 'Reveals microorganisms cells and bacteria', 'Pioneered by Antonie van Leeuwenhoek', 'Utilizes objective and ocular lenses', 'Found in every biological laboratory'], 'answer' => 'Microscope', 'hint' => 'Tool to view tiny microorganisms'],
                ['title' => 'Continental Drift', 'clues' => ['Scientific theory of moving lithospheric plates', 'Drives continental drift over millions of years', 'Generates earthquakes along fault lines', 'Forms towering mountain ranges and oceanic trenches', 'Ring of Fire around the Pacific'], 'answer' => 'Plate Tectonics', 'hint' => 'Moving crustal plates theory'],
                ['title' => 'Cosmic Speed', 'clues' => ['Maximum speed limit in the physical universe', 'Roughly 299,792 kilometers per second', 'Denoted by constant c in physics equations', 'Einstein famous E=mc2 equation component', 'Takes about 8 minutes to travel from Sun to Earth'], 'answer' => 'Speed of Light', 'hint' => 'Cosmic maximum velocity limit'],
                ['title' => 'Carbon Crystal', 'clues' => ['Hardest known natural mineral on Earth', 'Pure crystalline allotrope of carbon', 'Forms under extreme heat and mantle pressure', 'Scores a perfect 10 on the Mohs hardness scale', 'Used in precision industrial cutting and fine jewelry'], 'answer' => 'Diamond', 'hint' => 'Hardest natural gemstone'],
            ],
            'history' => [
                ['title' => 'Ancient Arena', 'clues' => ['Roman gladiators', 'Flavian amphitheatre', 'Center of Rome', 'Arched stone facade', 'Fought wild beasts'], 'answer' => 'Colosseum', 'hint' => 'Historic amphitheatre in Rome'],
                ['title' => 'Monumental Barrier', 'clues' => ['Thousands of miles long', 'Guarded northern dynasty', 'Ming dynasty watchtowers', 'Built from brick and tamped earth', 'Symbol of ancient China'], 'answer' => 'Great Wall', 'hint' => 'Famous wall in China'],
                ['title' => 'Pharaoh Kingdom', 'clues' => ['Nile river valley', 'Hieroglyphic writing', 'Pyramids and Sphinx', 'Tutankhamun golden mask', 'Mummies and papyrus'], 'answer' => 'Egypt', 'hint' => 'Ancient North African kingdom'],
                ['title' => 'Renaissance Polymath', 'clues' => ['Mona Lisa painter', 'The Last Supper', 'Florentine master', 'Sketched flying machines', 'Vitruvian Man drawings'], 'answer' => 'Leonardo da Vinci', 'hint' => 'Italian painter and genius'],
                ['title' => 'White Marble Wonder', 'clues' => ['Magnificent ivory white marble mausoleum', 'Commissioned by Mughal Emperor Shah Jahan', 'Dedicated to beloved queen Mumtaz Mahal', 'Located on the banks of Yamuna River in Agra', 'UNESCO World Heritage landmark in India'], 'answer' => 'Taj Mahal', 'hint' => 'Famous marble wonder in Agra'],
                ['title' => 'Storm of 1789', 'clues' => ['Violent storming of the Bastille prison fortress', 'Liberty equality fraternity slogan', 'Overthrew French royal monarchy and Louis XVI', 'Era of the Guillotine and Reign of Terror', 'Paved the way for Napoleon Bonaparte'], 'answer' => 'French Revolution', 'hint' => '1789 European revolution'],
                ['title' => 'Age of Mechanization', 'clues' => ['Transition from hand production to factories', 'Steam engine developed by James Watt', 'Originated in Britain during 18th century', 'Transformed textile manufacturing and railways', 'Birth of modern urban working society'], 'answer' => 'Industrial Revolution', 'hint' => 'Steam and manufacturing epoch'],
                ['title' => 'Ancient Silk Path', 'clues' => ['Historical network of Eurasian trade routes', 'Connected China with the Mediterranean world', 'Traded silk spices porcelain and glass', 'Traveled by Venetian merchant Marco Polo', 'Facilitated widespread cultural exchange'], 'answer' => 'Silk Road', 'hint' => 'Historic East-West trade route'],
                ['title' => 'Ides of March', 'clues' => ['Roman general and statesman', 'Crossed the Rubicon river in 49 BC', 'Declared dictator in perpetuity', 'Assassinated on the Ides of March in 44 BC', 'Reformed the Roman calendar'], 'answer' => 'Julius Caesar', 'hint' => 'Famous Roman dictator'],
                ['title' => 'Charter of Liberties', 'clues' => ['Historic charter of rights granted in 1215', 'Signed by King John of England at Runnymede', 'Established the principle that everyone is subject to law', 'Foundational cornerstone of modern constitutional law', 'Latin title meaning Great Charter'], 'answer' => 'Magna Carta', 'hint' => '1215 English freedom charter'],
                ['title' => 'Macedonian Emperor', 'clues' => ['King of ancient Greek kingdom of Macedon', 'Tutored by philosopher Aristotle', 'Conquered the vast Persian Empire before age 30', 'Undefeated in military combat throughout his life', 'Founded dozens of cities bearing his name'], 'answer' => 'Alexander the Great', 'hint' => 'Macedonian world conqueror'],
                ['title' => 'Florentine Rebirth', 'clues' => ['Fervent period of European cultural rebirth', 'Originated in Florence Italy in the 14th century', 'Sparked classical philosophy literature and art', 'Championed humanism perspective and inquiry', 'Famous artists include Michelangelo and Raphael'], 'answer' => 'Renaissance', 'hint' => 'European cultural revival period'],
            ],
            'geography' => [
                ['title' => 'Roof of the World', 'clues' => ['Highest mountain on Earth', '8,848 meters elevation', 'Himalayan mountain range', 'Border of Nepal and China', 'First summited by Hillary & Norgay'], 'answer' => 'Mount Everest', 'hint' => 'Tallest mountain peak'],
                ['title' => 'Mighty River', 'clues' => ['Longest river in South America', 'Drains into Atlantic', 'Flows through rainforest', 'Home to pink river dolphins', 'Discharges massive water volume'], 'answer' => 'Amazon River', 'hint' => 'South American rainforest river'],
                ['title' => 'City of Romance', 'clues' => ['Eiffel Tower landmark', 'Louvre museum', 'River Seine bridges', 'Capital of France', 'Hosted 2024 Olympic Games'], 'answer' => 'Paris', 'hint' => 'French capital city'],
                ['title' => 'Dune Ocean', 'clues' => ['Largest hot desert in the world', 'Spans across Northern Africa', 'Endless rolling sand dunes and arid regs', 'Home to Tuareg camel caravans and oases', 'Extreme temperature fluctuations between day and night'], 'answer' => 'Sahara Desert', 'hint' => 'Vast African hot desert'],
                ['title' => 'Greatest Waters', 'clues' => ['Largest and deepest ocean basin on Earth', 'Covers more than 30 percent of planetary surface', 'Ringed by the volcanic Pacific Ring of Fire', 'Contains Mariana Trench and Hawaiian archipelago', 'Named by explorer Ferdinand Magellan for peace'], 'answer' => 'Pacific Ocean', 'hint' => 'Largest global ocean'],
                ['title' => 'Carved Abyss', 'clues' => ['Immense steep-sided gorge in Arizona', 'Carved over millions of years by Colorado River', 'Exposes horizontal layers of ancient rock strata', 'Protected as a renowned US National Park', 'One of the seven natural wonders of the world'], 'answer' => 'Grand Canyon', 'hint' => 'Massive Arizona river canyon'],
                ['title' => 'Deepest Floor', 'clues' => ['Deepest oceanic trench on the planet', 'Challenger Deep reaches nearly 11,000 meters down', 'Located in the western Pacific near Guam', 'Atmospheric pressure exceeds 1,000 times sea level', 'Pitch black freezing abyssal environment'], 'answer' => 'Mariana Trench', 'hint' => 'Earth deepest ocean abyss'],
                ['title' => 'Coral Kingdom', 'clues' => ['World largest coral reef ecosystem', 'Extends along the coast of Queensland Australia', 'Visible from low Earth orbit space', 'Home to thousands of marine species and turtles', 'Protected UNESCO World Heritage marvel'], 'answer' => 'Great Barrier Reef', 'hint' => 'Vast Australian coral reef system'],
                ['title' => 'Polar Cap', 'clues' => ['Coldest driest and windiest continent on Earth', 'Permanently capped by miles-thick polar ice sheets', 'Surrounded by the freezing Southern Ocean', 'Home to breeding Emperor penguins', 'Dedicated purely to peaceful international scientific study'], 'answer' => 'Antarctica', 'hint' => 'South polar icy continent'],
                ['title' => 'Eastern Metropolis', 'clues' => ['Capital and largest metropolis of Japan', 'Home to iconic Shibuya crossing and Skytree', 'Fast efficient Shinkansen bullet trains', 'Framed by views of snow-capped Mount Fuji', 'Bustling blend of futuristic tech and historic shrines'], 'answer' => 'Tokyo', 'hint' => 'Capital city of Japan'],
                ['title' => 'Fire and Ice Realm', 'clues' => ['North Atlantic island nation near Arctic Circle', 'Famous for active volcanoes geysers and glaciers', 'Capital city is Reykjavik', 'Powered almost entirely by green geothermal energy', 'Enchants visitors with the Aurora Borealis'], 'answer' => 'Iceland', 'hint' => 'Nordic island of geysers and glaciers'],
                ['title' => 'Lifeline of Africa', 'clues' => ['Longest north-flowing river in the world', 'Primary water source for eleven African countries', 'Historic lifeline and trade route of Ancient Egypt', 'Feeds into Mediterranean Sea through vast delta', 'Lake Victoria is its primary reservoir source'], 'answer' => 'Nile River', 'hint' => 'Famous north-flowing African river'],
            ],
            'sports' => [
                ['title' => 'The Beautiful Game', 'clues' => ['11 players each side', 'FIFA World Cup', 'No hands allowed on ball', 'Goalposts with net', 'Messi and Pele legends'], 'answer' => 'Football', 'hint' => 'Also called soccer'],
                ['title' => 'Gentleman Game', 'clues' => ['Bat, ball and wickets', '22-yard pitch', 'Bowler and batsman', 'Test, ODI and T20', 'Centuries and sixes'], 'answer' => 'Cricket', 'hint' => 'Pitch and wicket sport'],
                ['title' => 'Olympic Torch', 'clues' => ['Five interlocking rings', 'Summer and Winter editions', 'Origin in ancient Greece', 'Gold, Silver and Bronze medals', 'Held every 4 years'], 'answer' => 'Olympics', 'hint' => 'Global sporting games'],
                ['title' => 'Hardwood Hoops', 'clues' => ['Played by 5 players on indoor court', 'Orange ball shot through 10-foot elevated hoop', 'Invented by Dr James Naismith in 1891', 'NBA league features icons like Michael Jordan and LeBron', 'Dribbling passing and slam dunks'], 'answer' => 'Basketball', 'hint' => 'Court sport with hoop and dunk'],
                ['title' => 'Court of Aces', 'clues' => ['Racket sport played on grass clay or hard court', 'Grand Slam events include Wimbledon and French Open', 'Scoring uses love 15 30 40 and deuce', 'Fierce rallies with topspin and baseline volleys', 'Legends include Federer Nadal and Serena Williams'], 'answer' => 'Tennis', 'hint' => 'Racket game with Wimbledon'],
                ['title' => 'Apex Motorsport', 'clues' => ['Highest class of international single-seater auto racing', 'Teams include Scuderia Ferrari Mercedes and Red Bull', 'High downforce aerodynamic cars and pit stop tyre changes', 'Grand Prix races staged around the globe', 'Champions like Ayrton Senna and Lewis Hamilton'], 'answer' => 'Formula 1', 'hint' => 'Premier open-wheel auto racing'],
                ['title' => 'Endurance Classical', 'clues' => ['Long-distance road running race over 42.195 km', 'Named after Greek soldier Pheidippides legend', 'Signature event closing the Summer Olympic Games', 'Major annual events in Boston London and Berlin', 'Demands relentless mental and physical stamina'], 'answer' => 'Marathon', 'hint' => '26.2 mile endurance run'],
                ['title' => 'Checkered War', 'clues' => ['Ancient game played on an 8x8 checkered grid', 'Each player controls 16 distinct wooden pieces', 'Ultimate goal is trapping the enemy King in checkmate', 'Grandmasters like Garry Kasparov and Magnus Carlsen', 'Famous openings like Sicilian Defense and Queen Gambit'], 'answer' => 'Chess', 'hint' => 'Strategic board game of kings'],
                ['title' => 'Aquatic Speed', 'clues' => ['Competitive water racing in 50-meter Olympic pools', 'Features freestyle breaststroke backstroke and butterfly', 'Michael Phelps holds record for most Olympic medals', 'Flip turns streamline technique and touch pads', 'Test of lung capacity upper body and kicking power'], 'answer' => 'Swimming', 'hint' => 'Water pool racing sport'],
                ['title' => 'Feathered Shuttle', 'clues' => ['High speed racket game played across elevated net', 'Projectile is a feathered or synthetic shuttlecock', 'Features lightning fast smashes drop shots and clears', 'Widely popular across Asia and Scandinavian nations', 'Fastest recorded projectile speeds in racket sports'], 'answer' => 'Badminton', 'hint' => 'Racket game with shuttlecock'],
                ['title' => 'Sweet Science', 'clues' => ['Combat martial sport inside a roped canvas ring', 'Contenders wear padded gloves and mouthguards', 'Matches scored over 12 rounds or won by knockout', 'Iconic legends include Muhammad Ali and Mike Tyson', 'Requires disciplined footwork jabs hooks and slipping'], 'answer' => 'Boxing', 'hint' => 'Pugilistic glove combat sport'],
                ['title' => 'Fairway Journey', 'clues' => ['Precision club-and-ball sport over 18 holes', 'Objective is hitting ball into cup in fewest strokes', 'Features tees fairways sand bunkers and putting greens', 'Scoring terms include par birdie eagle and bogey', 'Major championships like The Masters in Augusta'], 'answer' => 'Golf', 'hint' => '18-hole club and ball game'],
            ],
            'nature' => [
                ['title' => 'Jungle King', 'clues' => ['Striped predator', 'Largest cat species', 'Bengal subspecies', 'Carnivore', 'Orange and black fur'], 'answer' => 'Tiger', 'hint' => 'National animal of India'],
                ['title' => 'Ocean Behemoth', 'clues' => ['Largest mammal', 'Baleen plates', 'Blowhole breathing', 'Krill feeder', 'Blue giant'], 'answer' => 'Whale', 'hint' => 'Gigantic sea creature'],
                ['title' => 'Amazon Wonder', 'clues' => ['Rainforest biome', 'Lungs of the Earth', 'South America', 'Discharges into Atlantic', 'Biodiversity hotspot'], 'answer' => 'Amazon', 'hint' => 'Largest river and rainforest by volume'],
                ['title' => 'Bamboo Feeder', 'clues' => ['Black and white coat', 'Native to China', 'Giant bear species', 'Eats bamboo 12 hours a day', 'Conservation icon'], 'answer' => 'Panda', 'hint' => 'Black and white bear'],
                ['title' => 'Gentle Colossus', 'clues' => ['Largest living terrestrial land animal', 'Distinguished by long prehensile trunk and ivory tusks', 'Remarkable memory and deep social herd bonds', 'African and Asian subspecies', 'Essential keystone ecosystem engineer'], 'answer' => 'Elephant', 'hint' => 'Large land mammal with trunk'],
                ['title' => 'Savanna Pride', 'clues' => ['Only cat species that lives in organized family prides', 'Male boasts a dark majestic protective mane', 'Females do the majority of tactical hunting', 'Roar can be heard from 5 miles away', 'Often called King of the Jungle'], 'answer' => 'Lion', 'hint' => 'Majestic African big cat'],
                ['title' => 'Canopy Giant', 'clues' => ['Tallest living tree species on the planet', 'Towering evergreen conifers along the Pacific coast', 'Can live for more than 2,000 years', 'Bark resists fire insects and rot', 'Hyperion is the tallest known specimen'], 'answer' => 'Redwood Tree', 'hint' => 'Tallest tree in the world'],
                ['title' => 'Golden Pollinator', 'clues' => ['Social flying insect living in wax honeycomb hives', 'Communicates via waggle dance language', 'Collects nectar and pollen from blooming flowers', 'Produces golden sweet honey that never spoils', 'Crucial pollinator for global food crops'], 'answer' => 'Honeybee', 'hint' => 'Buzzing honey producer'],
                ['title' => 'Living Ocean Rock', 'clues' => ['Tiny marine invertebrate polyps living in colonies', 'Secretes hard calcium carbonate exoskeletons', 'Forms massive underwater reefs over millennia', 'Provides shelter for 25 percent of all ocean life', 'Sensitive to sea temperature warming and bleaching'], 'answer' => 'Coral', 'hint' => 'Underwater reef building creature'],
                ['title' => 'Tuxedo Swimmer', 'clues' => ['Flightless aquatic bird native to the Southern Hemisphere', 'Countershaded black and white plumage for camouflage', 'Wings have evolved into rigid flippers for swimming', 'Feeds on krill fish and squid in icy waters', 'Emperor variety survives harsh Antarctic blizzards'], 'answer' => 'Penguin', 'hint' => 'Antarctic swimming flightless bird'],
                ['title' => 'Desert Voyager', 'clues' => ['Even-toed ungulate adapted to extreme desert climates', 'Stores fatty tissue reserves inside one or two humps', 'Thick foot pads navigate loose shifting sands', 'Can travel weeks without drinking open water', 'Known as the ship of the desert'], 'answer' => 'Camel', 'hint' => 'Humped desert pack animal'],
                ['title' => 'Sky Monarch', 'clues' => ['Formidable bird of prey with acute stereoscopic vision', 'Builds massive cliff eyrie nests', 'Soars effortlessly on warm thermal air currents', 'Sharp curved talons for catching agile prey', 'National symbol of multiple nations'], 'answer' => 'Golden Eagle', 'hint' => 'Keen-eyed soaring raptor'],
            ],
            'general' => [
                ['title' => 'Precious Metal', 'clues' => ['Symbol Au', 'Atomic number 79', '24 karat purity', 'Jewelry and bullion', 'Malleable and yellow'], 'answer' => 'Gold', 'hint' => 'Shiny yellow precious metal'],
                ['title' => 'Liquid of Life', 'clues' => ['H2O formula', 'Freezes at 0 Celsius', 'Covers 71% of Earth', 'Essential for all organisms', 'Evaporates into clouds'], 'answer' => 'Water', 'hint' => 'Life liquid'],
                ['title' => 'Timekeeper', 'clues' => ['12 hours dial', 'Pendulum or quartz', 'Ticking hands', 'Alarm wakes you up', 'Worn on wrist or wall'], 'answer' => 'Clock', 'hint' => 'Tells time'],
                ['title' => 'Amber Nectar', 'clues' => ['Sweet golden syrup produced by worker bees', 'Contains natural enzymes and low moisture', 'Archeologists found edible pots in ancient Egyptian tombs', 'Never spoils or decomposes over centuries', 'Natural sweetener and home remedy'], 'answer' => 'Honey', 'hint' => 'Sweet natural bee nectar'],
                ['title' => 'Gutenberg Revolution', 'clues' => ['Mechanical device for printing uniform text', 'Pioneered in Germany by Johannes Gutenberg around 1440', 'Used movable metal alloy type pieces', 'Sparked the spread of literacy knowledge and science', 'Printed the historic Latin Gutenberg Bible'], 'answer' => 'Printing Press', 'hint' => 'Movable type book printer'],
                ['title' => 'North Seeking Needle', 'clues' => ['Magnetized needle navigational instrument', 'Points consistently toward Earth Magnetic North', 'Invented during China Han Dynasty', 'Crucial tool during the global Age of Exploration', 'Features four cardinal compass rose directions'], 'answer' => 'Compass', 'hint' => 'Direction finding magnetic tool'],
                ['title' => 'Celestial Eyepiece', 'clues' => ['Optical viewing instrument with curved lenses or mirrors', 'Invented in the Netherlands in the early 17th century', 'Galileo used it to discover four moons of Jupiter', 'Magnifies distant stars nebulae and planets', 'Installed on high mountaintops and in space'], 'answer' => 'Telescope', 'hint' => 'Cosmic optical magnifier'],
                ['title' => 'Scandinavian Honor', 'clues' => ['Prestigious international awards created in 1895', 'Endowed by Swedish dynamite inventor Alfred Nobel', 'Awarded in Physics Chemistry Medicine Literature and Peace', 'Conferred annually with a gold medal and diploma', 'Ceremonies held in Stockholm and Oslo'], 'answer' => 'Nobel Prize', 'hint' => 'Prestigious annual international award'],
                ['title' => 'Prismatic Arch', 'clues' => ['Meteorological phenomenon caused by reflection and refraction', 'Forms when sunlight shines through falling rain droplets', 'Displays continuous arc of seven spectral colors', 'Red appears on outer arc and violet on inner', 'Appears opposite to the direction of the Sun'], 'answer' => 'Rainbow', 'hint' => 'Seven-colored sky arch'],
                ['title' => 'Thunder Bolt', 'clues' => ['Naturally occurring electrostatic discharge', 'Occurs within clouds or between cloud and ground', 'Accompanied by the sonic shockwave of thunder', 'Can reach temperatures hotter than the surface of the Sun', 'Channel carries up to hundreds of millions of volts'], 'answer' => 'Lightning', 'hint' => 'Thunderstorm electrical discharge'],
                ['title' => 'Morning Elixir', 'clues' => ['Stimulating beverage brewed from roasted beans', 'Native to Ethiopian plateau coffee forests', 'Contains natural alkaloid stimulant caffeine', 'Served as espresso cappuccino latte or drip', 'One of the most traded agricultural commodities'], 'answer' => 'Coffee', 'hint' => 'Brewed morning caffeine drink'],
                ['title' => 'Strategy of 32', 'clues' => ['Ancient two-player strategy board game', 'Originates from ancient Indian game Chaturanga', '32 pieces navigate 64 black and white squares', 'Pawns knights bishops rooks queen and king', 'Goal is delivering an inescapable checkmate'], 'answer' => 'Chess', 'hint' => 'Classic strategy board game'],
            ]
        ];

        $topicKey = 'general';
        $lowerTopic = strtolower($topic);
        if (
            str_contains($lowerTopic, 'cyber') ||
            str_contains($lowerTopic, 'security') ||
            str_contains($lowerTopic, 'hack') ||
            str_contains($lowerTopic, 'malware') ||
            str_contains($lowerTopic, 'firewall') ||
            str_contains($lowerTopic, 'vpn') ||
            str_contains($lowerTopic, 'phish') ||
            str_contains($lowerTopic, 'crypto') ||
            str_contains($lowerTopic, 'encrypt')
        ) {
            $topicKey = 'cyber_security';
        } elseif (
            str_contains($lowerTopic, 'space') ||
            str_contains($lowerTopic, 'planet') ||
            str_contains($lowerTopic, 'astro') ||
            str_contains($lowerTopic, 'star') ||
            str_contains($lowerTopic, 'galaxy') ||
            str_contains($lowerTopic, 'cosmos') ||
            str_contains($lowerTopic, 'nasa') ||
            str_contains($lowerTopic, 'orbit') ||
            str_contains($lowerTopic, 'mars')
        ) {
            $topicKey = 'space';
        } elseif (
            str_contains($lowerTopic, 'tech') ||
            str_contains($lowerTopic, 'computer') ||
            str_contains($lowerTopic, 'code') ||
            str_contains($lowerTopic, 'software') ||
            str_contains($lowerTopic, 'ai') ||
            str_contains($lowerTopic, 'robot') ||
            str_contains($lowerTopic, 'cloud') ||
            str_contains($lowerTopic, 'program') ||
            str_contains($lowerTopic, 'digital') ||
            str_contains($lowerTopic, 'data')
        ) {
            $topicKey = 'technology';
        } elseif (
            str_contains($lowerTopic, 'sci') ||
            str_contains($lowerTopic, 'physics') ||
            str_contains($lowerTopic, 'chem') ||
            str_contains($lowerTopic, 'bio') ||
            str_contains($lowerTopic, 'atom') ||
            str_contains($lowerTopic, 'dna') ||
            str_contains($lowerTopic, 'gravity') ||
            str_contains($lowerTopic, 'lab')
        ) {
            $topicKey = 'science';
        } elseif (
            str_contains($lowerTopic, 'hist') ||
            str_contains($lowerTopic, 'war') ||
            str_contains($lowerTopic, 'empire') ||
            str_contains($lowerTopic, 'ancient') ||
            str_contains($lowerTopic, 'dynasty') ||
            str_contains($lowerTopic, 'king') ||
            str_contains($lowerTopic, 'revolut')
        ) {
            $topicKey = 'history';
        } elseif (
            str_contains($lowerTopic, 'geo') ||
            str_contains($lowerTopic, 'river') ||
            str_contains($lowerTopic, 'capital') ||
            str_contains($lowerTopic, 'country') ||
            str_contains($lowerTopic, 'mountain') ||
            str_contains($lowerTopic, 'ocean') ||
            str_contains($lowerTopic, 'desert') ||
            str_contains($lowerTopic, 'city')
        ) {
            $topicKey = 'geography';
        } elseif (
            str_contains($lowerTopic, 'sport') ||
            str_contains($lowerTopic, 'cricket') ||
            str_contains($lowerTopic, 'football') ||
            str_contains($lowerTopic, 'soccer') ||
            str_contains($lowerTopic, 'tennis') ||
            str_contains($lowerTopic, 'game') ||
            str_contains($lowerTopic, 'olympic') ||
            str_contains($lowerTopic, 'match')
        ) {
            $topicKey = 'sports';
        } elseif (
            str_contains($lowerTopic, 'nature') ||
            str_contains($lowerTopic, 'animal') ||
            str_contains($lowerTopic, 'earth') ||
            str_contains($lowerTopic, 'forest') ||
            str_contains($lowerTopic, 'wild') ||
            str_contains($lowerTopic, 'plant')
        ) {
            $topicKey = 'nature';
        }

        $items = $aiTemplates[$topicKey] ?? $aiTemplates['general'];
        $generated = [];

        for ($idx = 0; $idx < $count; $idx++) {
            $templateIndex = $idx % count($items);
            $templateItem = $items[$templateIndex];

            // Map each question to selected categories in round-robin order
            $assignedCatId = null;
            if (!empty($categoryIds)) {
                $assignedCatId = $categoryIds[$idx % count($categoryIds)];
            }

            $baseTitle = "{$topic}: " . $templateItem['title'];
            $questionTitle = $baseTitle;

            // Ensure unique title in database so each generation creates a distinct new question
            $duplicateCount = Question::where('title', 'like', "{$baseTitle}%")->count();
            if ($duplicateCount > 0) {
                $questionTitle = "{$baseTitle} #" . ($duplicateCount + 1);
            }

            $q = Question::create([
                'category_id' => $assignedCatId,
                'title' => $questionTitle,
                'clues' => $templateItem['clues'],
                'answer' => $templateItem['answer'],
                'hint' => $templateItem['hint'],
                'level' => $level,
                'points' => 10 + ($level * 2),
                'is_active' => true,
            ]);

            $generated[] = $q->load('category');
        }

        return response()->json([
            'success' => true,
            'message' => "Successfully generated " . count($generated) . " AI questions for topic: '{$topic}'",
            'questions' => $generated,
        ]);
    }
}
