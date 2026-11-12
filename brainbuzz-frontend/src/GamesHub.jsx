import './GamesHub.css'

function GamesHub({ onBack, onSelectMode }) {
    const gameModes = [
        {
            id: 'iq',
            icon: '🧩',
            title: 'BrainBuzz IQ Challenge',
            description:
                'Test your logical thinking, pattern recognition, number series and problem-solving skills.',
            skills: ['Logic', 'Patterns', 'Reasoning'],
            difficulty: 'Adaptive Difficulty',
            color: 'iq',
        },
        {
            id: 'training',
            icon: '🧠',
            title: 'BrainBuzz Brain Training',
            description:
                'Improve memory, focus, reaction speed and spatial thinking through interactive exercises.',
            skills: ['Memory', 'Focus', 'Reaction'],
            difficulty: 'Skill Based Training',
            color: 'training',
        },
        {
            id: 'knowledge',
            icon: '🌍',
            title: 'BrainBuzz Knowledge Challenge',
            description:
                'Explore science, technology, history, geography, sports and general knowledge.',
            skills: ['Science', 'History', 'Technology'],
            difficulty: 'Multiple Categories',
            color: 'knowledge',
        },
    ]

    return (
        <main className="games-hub-container">
            <button className="games-hub-back" onClick={onBack}>
                ← Back to Dashboard
            </button>

            <section className="games-hub-heading">
                <span className="games-hub-eyebrow">
                    EXPLORE YOUR MIND
                </span>

                <h1>Welcome to BrainBuzz Games</h1>

                <p>
                    Challenge your thinking, train your brain and expand
                    your knowledge with interactive games.
                </p>
            </section>

            <section className="games-hub-grid">
                {gameModes.map((mode) => (
                    <article
                        className={`games-hub-card ${mode.color}`}
                        key={mode.id}
                    >
                        <div className="games-hub-icon">
                            {mode.icon}
                        </div>

                        <span className="games-hub-label">
                            BRAINBUZZ GAME MODE
                        </span>

                        <h2>{mode.title}</h2>

                        <p className="games-hub-description">
                            {mode.description}
                        </p>

                        <div className="games-hub-skills">
                            {mode.skills.map((skill) => (
                                <span key={skill}>{skill}</span>
                            ))}
                        </div>

                        <div className="games-hub-card-footer">
                            <span>{mode.difficulty}</span>

                            <button
                                onClick={() => {
                                console.log('EXPLORE CLICKED:', mode.id)
                                onSelectMode(mode.id)
                            }}
                            >
                                Explore Game <span>→</span>
                            </button>
                        </div>
                    </article>
                ))}
            </section>
        </main>
    )
}

export default GamesHub
